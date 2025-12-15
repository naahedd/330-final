from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    """User model - nesds to be extended when OAuth is implemented"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=True)
    username = db.Column(db.String(80), unique=True, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    interactions = db.relationship('UserInteraction', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'created_at': self.created_at.isoformat()
        }


class Article(db.Model):
    """Article model - stores Wikipedia articles"""
    __tablename__ = 'articles'
    
    id = db.Column(db.Integer, primary_key=True)
    wiki_id = db.Column(db.String(50), unique=True, nullable=False)  # Wikipedia page ID
    title = db.Column(db.String(200), nullable=False)
    summary = db.Column(db.Text, nullable=True)
    url = db.Column(db.String(500), nullable=False)
    thumbnail = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    interactions = db.relationship('UserInteraction', backref='article', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.wiki_id,
            'title': self.title,
            'summary': self.summary,
            'url': self.url,
            'thumbnail': self.thumbnail,
            'extract': self.summary
        }


class UserInteraction(db.Model):
    """User interactions with articles"""
    __tablename__ = 'user_interactions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    article_id = db.Column(db.Integer, db.ForeignKey('articles.id'), nullable=False)
    liked = db.Column(db.Boolean, default=False)
    viewed = db.Column(db.Boolean, default=False)
    viewed_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'article_id', name='unique_user_article'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'article_id': self.article_id,
            'liked': self.liked,
            'viewed': self.viewed,
            'viewed_at': self.viewed_at.isoformat()
        }
