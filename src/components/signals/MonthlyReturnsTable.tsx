'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { BacktestResult } from '@/lib/signals/types';

interface MonthlyReturnsTableProps {
  result: BacktestResult;
}

interface YearlyData {
  year: string;
  months: (number | null)[];
  yearly: number;
}

export function MonthlyReturnsTable({ result }: MonthlyReturnsTableProps) {
  // Parse monthly returns into year/month structure
  const yearlyData: YearlyData[] = [];
  const yearMap = new Map<string, (number | null)[]>();

  result.monthlyReturns.forEach(({ month, return: ret }) => {
    const [year, monthNum] = month.split('-');
    const monthIndex = parseInt(monthNum, 10) - 1;

    if (!yearMap.has(year)) {
      yearMap.set(year, Array(12).fill(null));
    }
    yearMap.get(year)![monthIndex] = ret;
  });

  // Calculate yearly totals and create data structure
  yearMap.forEach((months, year) => {
    const validMonths = months.filter((m): m is number => m !== null);
    const yearlyReturn = validMonths.reduce((sum, m) => {
      // Compound returns
      return (1 + sum / 100) * (1 + m / 100) * 100 - 100;
    }, 0);

    yearlyData.push({
      year,
      months,
      yearly: yearlyReturn,
    });
  });

  // Sort by year
  yearlyData.sort((a, b) => a.year.localeCompare(b.year));

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  const getColorClass = (value: number | null) => {
    if (value === null) return 'text-muted-foreground';
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const formatValue = (value: number | null) => {
    if (value === null) return '-';
    const formatted = value.toFixed(1);
    return value > 0 ? `+${formatted}%` : `${formatted}%`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">월별 수익률</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">연도</TableHead>
                {monthNames.map((month) => (
                  <TableHead key={month} className="text-center w-14 text-xs">
                    {month}
                  </TableHead>
                ))}
                <TableHead className="text-center w-16 font-semibold">연간</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {yearlyData.map((row) => (
                <TableRow key={row.year}>
                  <TableCell className="font-medium">{row.year}</TableCell>
                  {row.months.map((value, index) => (
                    <TableCell
                      key={index}
                      className={`text-center text-xs ${getColorClass(value)}`}
                    >
                      {formatValue(value)}
                    </TableCell>
                  ))}
                  <TableCell
                    className={`text-center font-semibold ${getColorClass(row.yearly)}`}
                  >
                    {formatValue(row.yearly)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
