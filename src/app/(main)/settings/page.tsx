'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [isSaving, setIsSaving] = useState(false);

  // 차트 설정
  const [defaultInterval, setDefaultInterval] = useState('D');
  const [theme, setTheme] = useState('dark');

  // 기본 지표 설정
  const [showMA, setShowMA] = useState(true);
  const [showVolume, setShowVolume] = useState(true);

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: API 연동하여 설정 저장
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="container mx-auto py-4 sm:py-6 px-4 max-w-2xl">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">설정</h1>

      <div className="space-y-4 sm:space-y-6">
        {/* 계정 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>계정 정보</CardTitle>
            <CardDescription>계정 기본 정보를 확인하고 수정합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={session?.user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                이메일은 변경할 수 없습니다.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                defaultValue={session?.user?.name || ''}
                placeholder="이름을 입력하세요"
              />
            </div>
          </CardContent>
        </Card>

        {/* 차트 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>차트 설정</CardTitle>
            <CardDescription>차트의 기본 설정을 변경합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="interval">기본 시간 프레임</Label>
              <Select value={defaultInterval} onValueChange={setDefaultInterval}>
                <SelectTrigger id="interval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="D">일봉</SelectItem>
                  <SelectItem value="W">주봉</SelectItem>
                  <SelectItem value="M">월봉</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="theme">테마</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">다크</SelectItem>
                  <SelectItem value="light">라이트</SelectItem>
                  <SelectItem value="system">시스템</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>기본 표시 지표</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={showMA ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowMA(!showMA)}
                >
                  이동평균선
                </Button>
                <Button
                  variant={showVolume ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowVolume(!showVolume)}
                >
                  거래량
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                차트를 열 때 기본으로 표시할 지표를 선택합니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 알림 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>알림 설정</CardTitle>
            <CardDescription>알림 수신 방법을 설정합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium">이메일 알림</p>
                <p className="text-sm text-muted-foreground">
                  매매 신호 발생 시 이메일로 알림을 받습니다.
                </p>
              </div>
              <Button variant="outline" size="sm" disabled className="w-full sm:w-auto">
                준비 중
              </Button>
            </div>
            <Separator />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium">푸시 알림</p>
                <p className="text-sm text-muted-foreground">
                  브라우저 푸시 알림을 받습니다.
                </p>
              </div>
              <Button variant="outline" size="sm" disabled className="w-full sm:w-auto">
                준비 중
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 저장 버튼 */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            저장
          </Button>
        </div>
      </div>
    </div>
  );
}
