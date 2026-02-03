import { useState, ChangeEvent, FormEvent } from 'react';
import { 
  Send, 
  Play, 
  Square, 
  Clock, 
  Link as LinkIcon,
  MessageSquare,
  Timer,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { Label } from '~/components/ui/label';
import { StatusBadge, StatusDot } from '~/components/status-badge';
import { Alert, AlertDescription } from '~/components/ui/alert';
import useStore from '~/store/useStore';
import { toast } from 'sonner';

const AutoPost = () => {
  const { autoPostConfig, setAutoPostConfig, autoPostStatus, setAutoPostStatus } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<'start' | 'stop' | null>(null);

  const handleConfigChange = (field: string, value: string | number) => {
    setAutoPostConfig({ [field]: value });
  };

  const handleStart = async () => {
    // Validation
    if (!autoPostConfig.caption.trim()) {
      toast.error('Caption tidak boleh kosong');
      return;
    }
    if (!autoPostConfig.groupLink.trim()) {
      toast.error('Link grup Telegram tidak boleh kosong');
      return;
    }
    if (autoPostConfig.interval < 10) {
      toast.error('Interval minimal 10 detik');
      return;
    }

    setIsLoading(true);
    setAction('start');

    // Simulate API call
    setTimeout(() => {
      setAutoPostStatus('RUNNING');
      toast.success('Auto Post dimulai!', {
        description: 'Bot akan mulai mengirim postingan sesuai jadwal',
      });
      setIsLoading(false);
      setAction(null);
    }, 1000);
  };

  const handleStop = async () => {
    setIsLoading(true);
    setAction('stop');

    // Simulate API call
    setTimeout(() => {
      setAutoPostStatus('STOPPED');
      toast.success('Auto Post dihentikan', {
        description: 'Bot tidak akan mengirim postingan lagi',
      });
      setIsLoading(false);
      setAction(null);
    }, 1000);
  };

  const isRunning = autoPostStatus === 'RUNNING';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground flex items-center gap-3">
            <Send className="w-7 h-7 text-primary" />
            Auto Post Telegram
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola posting otomatis ke grup Telegram
          </p>
        </div>
        
        <StatusBadge status={autoPostStatus} />
      </div>

      {/* Status Alert */}
      {isRunning && (
        <Alert className="border-success/30 bg-success/10">
          <StatusDot status={true} size="sm" />
          <AlertDescription className="text-success ml-2">
            Bot sedang berjalan dan akan mengirim postingan setiap {autoPostConfig.interval} detik 
            dari pukul {autoPostConfig.startTime} sampai {autoPostConfig.endTime}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Form */}
        <Card className="premium-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-heading">Konfigurasi Posting</CardTitle>
            <CardDescription>
              Atur pesan dan jadwal posting otomatis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Caption */}
            <div className="space-y-2">
              <Label htmlFor="caption" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                Caption Postingan
              </Label>
              <Textarea
                id="caption"
                placeholder="Masukkan caption untuk postingan Telegram..."
                value={autoPostConfig.caption}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleConfigChange('caption', e.target.value)}
                className="min-h-[120px] resize-none bg-background"
                disabled={isRunning}
              />
              <p className="text-xs text-muted-foreground">
                {autoPostConfig.caption.length} karakter
              </p>
            </div>

            {/* Interval */}
            <div className="space-y-2">
              <Label htmlFor="interval" className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-muted-foreground" />
                Interval Posting (detik)
              </Label>
              <Input
                id="interval"
                type="number"
                min={10}
                max={3600}
                value={autoPostConfig.interval}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleConfigChange('interval', parseInt(e.target.value) || 60)}
                className="bg-background"
                disabled={isRunning}
              />
              <p className="text-xs text-muted-foreground">
                Minimal 10 detik, maksimal 3600 detik (1 jam)
              </p>
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Waktu Mulai
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={autoPostConfig.startTime}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleConfigChange('startTime', e.target.value)}
                  className="bg-background"
                  disabled={isRunning}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endTime" className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Waktu Selesai
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={autoPostConfig.endTime}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleConfigChange('endTime', e.target.value)}
                  className="bg-background"
                  disabled={isRunning}
                />
              </div>
            </div>

            {/* Group Link */}
            <div className="space-y-2">
              <Label htmlFor="groupLink" className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
                Link Grup Telegram
              </Label>
              <Input
                id="groupLink"
                type="text"
                placeholder="https://t.me/grupanda atau @grupanda"
                value={autoPostConfig.groupLink}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleConfigChange('groupLink', e.target.value)}
                className="bg-background"
                disabled={isRunning}
              />
              <p className="text-xs text-muted-foreground">
                Masukkan link atau username grup Telegram
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Control Panel */}
        <div className="space-y-4">
          {/* Action Buttons */}
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Kontrol Bot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full h-12 bg-gradient-primary text-primary-foreground hover:opacity-90 btn-primary"
                onClick={handleStart}
                disabled={isRunning || isLoading}
              >
                {isLoading && action === 'start' ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Memulai...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Mulai Auto Post
                  </>
                )}
              </Button>
              
              <Button
                className="w-full h-12"
                variant="destructive"
                onClick={handleStop}
                disabled={!isRunning || isLoading}
              >
                {isLoading && action === 'stop' ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Menghentikan...
                  </>
                ) : (
                  <>
                    <Square className="w-5 h-5 mr-2" />
                    Hentikan Auto Post
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Status Info */}
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Status Bot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="flex items-center gap-2">
                  <StatusDot status={autoPostStatus} />
                  <span className={`text-sm font-medium ${
                    isRunning ? 'text-success' : 'text-destructive'
                  }`}>
                    {isRunning ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Interval</span>
                <span className="text-sm font-medium text-foreground">
                  {autoPostConfig.interval} detik
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Jadwal</span>
                <span className="text-sm font-medium text-foreground">
                  {autoPostConfig.startTime} - {autoPostConfig.endTime}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Warning */}
          <Alert className="border-warning/30 bg-warning/10">
            <AlertCircle className="w-4 h-4 text-warning" />
            <AlertDescription className="text-sm text-muted-foreground">
              Pastikan bot sudah terhubung dengan akun Telegram Anda di backend sebelum memulai auto post.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};

export default AutoPost;
