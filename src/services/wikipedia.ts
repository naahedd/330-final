import axios from 'axios';
import type { Article } from '../types';

const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';

export const fetchRandomArticles = async (count: number = 10): Promise<Article[]> => {
  try {
    const response = await axios.get(WIKIPEDIA_API, {
      params: {
        action: 'query',
        format: 'json',
        generator: 'random',
        grnnamespace: 0,
        grnlimit: count,
        prop: 'extracts|pageimages|info',
        exintro: true,
        explaintext: true,
        exsentences: 3,
        piprop: 'thumbnail',
        pithumbsize: 500,
        inprop: 'url',
        origin: '*'
      }
    });

    const pages = response.data.query?.pages || {};
    
    return Object.values(pages).map((page: any) => ({
      id: page.pageid.toString(),
      title: page.title,
      summary: page.extract || 'No summary available.',
      thumbnail: page.thumbnail?.source,
      url: page.fullurl,
      extract: page.extract || 'No content available.'
    }));
  } catch (error) {
    console.error('Error fetching Wikipedia articles:', error);
    return [];
  }
};

export const searchArticles = async (query: string): Promise<Article[]> => {
  try {
    const response = await axios.get(WIKIPEDIA_API, {
      params: {
        action: 'query',
        format: 'json',
        list: 'search',
        srsearch: query,
        srlimit: 10,
        origin: '*'
      }
    });

    const searchResults = response.data.query?.search || [];
    
    // Get full article details
    if (searchResults.length === 0) return [];
    
    const pageIds = searchResults.map((result: any) => result.pageid).join('|');
    
    const detailsResponse = await axios.get(WIKIPEDIA_API, {
      params: {
        action: 'query',
        format: 'json',
        pageids: pageIds,
        prop: 'extracts|pageimages|info',
        exintro: true,
        explaintext: true,
        exsentences: 3,
        piprop: 'thumbnail',
        pithumbsize: 500,
        inprop: 'url',
        origin: '*'
      }
    });

    const pages = detailsResponse.data.query?.pages || {};
    
    return Object.values(pages).map((page: any) => ({
      id: page.pageid.toString(),
      title: page.title,
      summary: page.extract || 'No summary available.',
      thumbnail: page.thumbnail?.source,
      url: page.fullurl,
      extract: page.extract || 'No content available.'
    }));
  } catch (error) {
    console.error('Error searching Wikipedia articles:', error);
    return [];
  }
};