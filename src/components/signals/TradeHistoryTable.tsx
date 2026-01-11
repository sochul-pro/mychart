'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Trade } from '@/lib/signals/types';

interface TradeHistoryTableProps {
  trades: Trade[];
}

type SortKey = 'entryTime' | 'returnPct' | 'pnl' | 'holdingDays';
type SortOrder = 'asc' | 'desc';

export function TradeHistoryTable({ trades }: TradeHistoryTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('entryTime');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showAll, setShowAll] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const sortedTrades = [...trades].sort((a, b) => {
    let aVal: number, bVal: number;

    switch (sortKey) {
      case 'entryTime':
        aVal = a.entryTime;
        bVal = b.entryTime;
        break;
      case 'returnPct':
        aVal = a.returnPct || 0;
        bVal = b.returnPct || 0;
        break;
      case 'pnl':
        aVal = a.pnl || 0;
        bVal = b.pnl || 0;
        break;
      case 'holdingDays':
        aVal = a.exitTime ? (a.exitTime - a.entryTime) / (1000 * 60 * 60 * 24) : 0;
        bVal = b.exitTime ? (b.exitTime - b.entryTime) / (1000 * 60 * 60 * 24) : 0;
        break;
      default:
        return 0;
    }

    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const displayedTrades = showAll ? sortedTrades : sortedTrades.slice(0, 10);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR');
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 inline" />
    ) : (
      <ChevronDown className="h-4 w-4 inline" />
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>거래 내역</span>
          <span className="text-sm font-normal text-muted-foreground">
            총 {trades.length}건
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('entryTime')}
                >
                  진입일 <SortIcon column="entryTime" />
                </TableHead>
                <TableHead>진입가</TableHead>
                <TableHead>청산일</TableHead>
                <TableHead>청산가</TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground text-right"
                  onClick={() => handleSort('returnPct')}
                >
                  수익률 <SortIcon column="returnPct" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground text-right"
                  onClick={() => handleSort('pnl')}
                >
                  손익 <SortIcon column="pnl" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground text-right"
                  onClick={() => handleSort('holdingDays')}
                >
                  보유일 <SortIcon column="holdingDays" />
                </TableHead>
                <TableHead className="text-center">상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedTrades.map((trade, index) => {
                const isProfit = (trade.returnPct || 0) > 0;
                const holdingDays = trade.exitTime
                  ? Math.round((trade.exitTime - trade.entryTime) / (1000 * 60 * 60 * 24))
                  : null;

                return (
                  <TableRow key={trade.id}>
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>{formatDate(trade.entryTime)}</TableCell>
                    <TableCell>{formatPrice(trade.entryPrice)}원</TableCell>
                    <TableCell>
                      {trade.exitTime ? formatDate(trade.exitTime) : '-'}
                    </TableCell>
                    <TableCell>
                      {trade.exitPrice ? `${formatPrice(trade.exitPrice)}원` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {trade.returnPct !== undefined ? (
                        <span
                          className={`flex items-center justify-end gap-1 ${
                            isProfit ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {isProfit ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {isProfit ? '+' : ''}
                          {trade.returnPct.toFixed(2)}%
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {trade.pnl !== undefined ? (
                        <span className={isProfit ? 'text-green-500' : 'text-red-500'}>
                          {isProfit ? '+' : ''}
                          {formatPrice(Math.round(trade.pnl))}원
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {holdingDays !== null ? `${holdingDays}일` : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={trade.status === 'closed' ? 'secondary' : 'default'}
                        className="text-xs"
                      >
                        {trade.status === 'closed' ? '청산' : '보유중'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {trades.length > 10 && (
          <div className="flex justify-center mt-4">
            <Button variant="outline" size="sm" onClick={() => setShowAll(!showAll)}>
              {showAll ? '간략히 보기' : `전체 ${trades.length}건 보기`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
