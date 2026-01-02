import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NewsCard } from './NewsCard';
import type { News } from '@/types';

describe('NewsCard', () => {
  const mockNews: News = {
    id: 'news-1',
    title: '삼성전자, 실적 호조에 주가 상승',
    summary: '삼성전자가 분기 실적 호조로 주가가 상승했습니다.',
    url: 'https://example.com/news/1',
    source: '한국경제',
    publishedAt: Date.now() - 2 * 60 * 60 * 1000, // 2시간 전
    sentiment: 'positive',
  };

  it('should render news title', () => {
    render(<NewsCard news={mockNews} />);
    expect(screen.getByText('삼성전자, 실적 호조에 주가 상승')).toBeInTheDocument();
  });

  it('should render news summary', () => {
    render(<NewsCard news={mockNews} />);
    expect(screen.getByText(/삼성전자가 분기 실적 호조로/)).toBeInTheDocument();
  });

  it('should render news source', () => {
    render(<NewsCard news={mockNews} />);
    expect(screen.getByText('한국경제')).toBeInTheDocument();
  });

  it('should render time ago', () => {
    render(<NewsCard news={mockNews} />);
    expect(screen.getByText('2시간 전')).toBeInTheDocument();
  });

  it('should render positive sentiment badge', () => {
    render(<NewsCard news={mockNews} />);
    expect(screen.getByText('긍정')).toBeInTheDocument();
  });

  it('should render negative sentiment badge', () => {
    render(<NewsCard news={{ ...mockNews, sentiment: 'negative' }} />);
    expect(screen.getByText('부정')).toBeInTheDocument();
  });

  it('should render neutral sentiment badge', () => {
    render(<NewsCard news={{ ...mockNews, sentiment: 'neutral' }} />);
    expect(screen.getByText('중립')).toBeInTheDocument();
  });

  it('should link to news url', () => {
    render(<NewsCard news={mockNews} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com/news/1');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should show "방금 전" for recent news', () => {
    render(<NewsCard news={{ ...mockNews, publishedAt: Date.now() - 30000 }} />);
    expect(screen.getByText('방금 전')).toBeInTheDocument();
  });

  it('should show minutes ago', () => {
    render(<NewsCard news={{ ...mockNews, publishedAt: Date.now() - 30 * 60 * 1000 }} />);
    expect(screen.getByText('30분 전')).toBeInTheDocument();
  });

  it('should show days ago', () => {
    render(<NewsCard news={{ ...mockNews, publishedAt: Date.now() - 2 * 24 * 60 * 60 * 1000 }} />);
    expect(screen.getByText('2일 전')).toBeInTheDocument();
  });
});
