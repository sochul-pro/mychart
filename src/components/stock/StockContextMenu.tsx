'use client';

import * as React from 'react';
import { ExternalLink } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface StockContextMenuProps {
  symbol: string;
  name: string;
  children: React.ReactNode;
  className?: string;
}

function extractStockCode(symbol: string): string {
  if (symbol.length === 12 && symbol.startsWith('KR')) {
    return symbol.slice(3, 9);
  }
  return symbol.slice(-6);
}

function getNaverStockUrl(symbol: string): string {
  const code = extractStockCode(symbol);
  return `https://finance.naver.com/item/main.nhn?code=${code}`;
}

export function StockContextMenu({
  symbol,
  children,
  className,
}: StockContextMenuProps) {
  const handleOpenNaver = () => {
    window.open(getNaverStockUrl(symbol), '_blank', 'noopener,noreferrer');
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild className={className}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={handleOpenNaver}>
          <ExternalLink className="mr-2 h-4 w-4" />
          네이버 종목 화면
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
