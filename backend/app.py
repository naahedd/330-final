from flask import Flask, request, jsonify, session, redirect, url_for
from flask_cors import CORS
from authlib.integrations.flask_client import OAuth
from models import db, User, Article, UserInteraction
from datetime import datetime
import os

app = Flask(__name__)
CORS(app, 
     supports_credentials=True,
     origins=[
         'http://localhost:5173',
         'https://330-final.vercel.app'
     ])
from dotenv import load_dotenv
import os

load_dotenv()  

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///wikitok.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'change-me'
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False  
app.config['FRONTEND_URL'] = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
app.config['GOOGLE_CLIENT_ID'] = os.environ.get('GOOGLE_CLIENT_ID')
app.config['GOOGLE_CLIENT_SECRET'] = os.environ.get('GOOGLE_CLIENT_SECRET')

oauth = OAuth(app)
oauth.register(
    name='google',
    client_id=app.config['GOOGLE_CLIENT_ID'],
    client_secret=app.config['GOOGLE_CLIENT_SECRET'],
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

db.init_app(app)

with app.app_context():
    db.create_all()


def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return None
    return User.query.get(user_id)


# OAuth routes
@app.route('/api/auth/login', methods=['GET'])
def login():
    if not app.config['GOOGLE_CLIENT_ID'] or not app.config['GOOGLE_CLIENT_SECRET']:
        return jsonify({'error': 'Google OAuth is not configured'}), 500

    redirect_uri = url_for('auth_callback', _external=True)
    return oauth.google.authorize_redirect(redirect_uri)


@app.route('/api/auth/callback', methods=['GET'])
@app.route('/api/auth/callback', methods=['GET'])
def auth_callback():
    try:
        token = oauth.google.authorize_access_token()
        user_info = token.get('userinfo')
        
        if not user_info:
            userinfo_response = oauth.google.get('https://www.googleapis.com/oauth2/v1/userinfo')
            user_info = userinfo_response.json()
            
    except Exception as error:
        print(f"OAuth Error: {error}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'OAuth callback failed: {str(error)}'}), 400

    email = user_info.get('email')
    if not email:
        return jsonify({'error': 'Email not available from Google'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        username = user_info.get('name') or email.split('@')[0]
        user = User(email=email, username=username)
        db.session.add(user)
        db.session.commit()

    session['user_id'] = user.id
    session['user_email'] = user.email
    session['user_name'] = user.username

    return redirect(app.config['FRONTEND_URL'])


@app.route('/api/auth/me', methods=['GET'])
def current_user():
    user = get_current_user()
    if not user:
        return jsonify({'user': None}), 401

    return jsonify({'user': user.to_dict()})


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out'})


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500


# Health check
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'WikiTok API is running'})


# Article endpoints
@app.route('/api/articles', methods=['POST'])
def save_article():
    """Saving an article to the database"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401

        data = request.get_json()
        
        # Validate input
        if not data or not data.get('id') or not data.get('title'):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if article already exists
        article = Article.query.filter_by(wiki_id=data['id']).first()
        
        if not article:
            article = Article(
                wiki_id=data['id'],
                title=data['title'],
                summary=data.get('summary', ''),
                url=data.get('url', ''),
                thumbnail=data.get('thumbnail')
            )
            db.session.add(article)
            db.session.commit()
        
        return jsonify({'message': 'Article saved', 'article': article.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/articles/<article_id>/like', methods=['POST'])
def like_article(article_id):
    """Like an article"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        # get or create article
        article = Article.query.filter_by(wiki_id=article_id).first()
        if not article:
            return jsonify({'error': 'Article not found'}), 404
        
        interaction = UserInteraction.query.filter_by(
            user_id=user.id,
            article_id=article.id
        ).first()
        
        if not interaction:
            interaction = UserInteraction(
                user_id=user.id,
                article_id=article.id,
                liked=True,
                viewed=True
            )
            db.session.add(interaction)
        else:
            interaction.liked = True
        
        db.session.commit()
        return jsonify({'message': 'Article liked', 'interaction': interaction.to_dict()})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/articles/<article_id>/like', methods=['DELETE'])
def unlike_article(article_id):
    """Unlike an article"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        article = Article.query.filter_by(wiki_id=article_id).first()
        if not article:
            return jsonify({'error': 'Article not found'}), 404
        
        interaction = UserInteraction.query.filter_by(
            user_id=user.id,
            article_id=article.id
        ).first()
        
        if interaction:
            interaction.liked = False
            db.session.commit()
        
        return jsonify({'message': 'Article unliked'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/articles/<article_id>/view', methods=['POST'])
def view_article(article_id):
    """Record article view"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        article = Article.query.filter_by(wiki_id=article_id).first()
        if not article:
            return jsonify({'error': 'Article not found'}), 404
        
        interaction = UserInteraction.query.filter_by(
            user_id=user.id,
            article_id=article.id
        ).first()
        
        if not interaction:
            interaction = UserInteraction(
                user_id=user.id,
                article_id=article.id,
                viewed=True
            )
            db.session.add(interaction)
        else:
            interaction.viewed = True
            interaction.viewed_at = datetime.utcnow()
        
        db.session.commit()
        return jsonify({'message': 'View recorded'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/articles/liked', methods=['GET'])
def get_liked_articles():
    """Get user's liked articles"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        # join query across all three tables
        liked_articles = db.session.query(Article).join(
            UserInteraction, Article.id == UserInteraction.article_id
        ).join(
            User, UserInteraction.user_id == User.id
        ).filter(
            User.id == user.id,
            UserInteraction.liked == True
        ).all()
        
        return jsonify({
            'articles': [article.to_dict() for article in liked_articles]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/articles/history', methods=['GET'])
def get_history():
    """Get user's viewing history"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        # join query with ordering
        viewed_articles = db.session.query(Article, UserInteraction.viewed_at).join(
            UserInteraction, Article.id == UserInteraction.article_id
        ).filter(
            UserInteraction.user_id == user.id,
            UserInteraction.viewed == True
        ).order_by(UserInteraction.viewed_at.desc()).all()
        
        articles = [
            {**article.to_dict(), 'viewed_at': viewed_at.isoformat()}
            for article, viewed_at in viewed_articles
        ]
        
        return jsonify({'articles': articles})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/user/stats', methods=['GET'])
def get_user_stats():
    """Get user statistics"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        total_viewed = UserInteraction.query.filter_by(
            user_id=user.id,
            viewed=True
        ).count()
        
        total_liked = UserInteraction.query.filter_by(
            user_id=user.id,
            liked=True
        ).count()
        
        return jsonify({
            'total_viewed': total_viewed,
            'total_liked': total_liked,
            'user': user.to_dict()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    debug_mode = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(debug=debug_mode, port=5000)
