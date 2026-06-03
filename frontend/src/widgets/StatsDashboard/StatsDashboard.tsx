import {
  Activity,
  Clock,
  Gauge,
  MapPin,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import type { ElementType } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStatistics } from "@/entities/statistics/hooks/useStatistics";
import { formatCoord, formatDate, formatSpeed } from "@/shared/lib/utils";
import type { Event } from "@/shared/types";

// Карточка одной метрики: показывает скелетон во время загрузки
function StatCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string;
  icon: ElementType;
  loading: boolean;
}) {
  return loading ? (
    <Skeleton className="h-24 w-full" />
  ) : (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>{title}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

interface StatsDashboardProps {
  onRefreshEvents?: () => void;
  onLocate?: (lat: number, lng: number, event?: Event) => void;
}

// Диалог с полной информацией о последнем событии и кнопкой перелёта на карту
function LastEventDialog({
  event,
  open,
  onOpenChange,
  onLocate,
}: {
  event: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocate?: (lat: number, lng: number, event?: Event) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton>
        <DialogTitle>Событие #{event.id}</DialogTitle>
        <Separator />
        <div className="flex justify-between">
          <span className="text-muted-foreground">ID объекта</span>
          <span className="font-medium">{event.oid}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Скорость</span>
          <span className="font-medium">{formatSpeed(event.sp)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Дата</span>
          <span className="font-medium">{formatDate(event.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Координаты</span>
          <span className="font-medium">
            {formatCoord(event.lat)}, {formatCoord(event.lng)}
          </span>
        </div>
        {onLocate && (
          <>
            <Separator />
            <Button
              variant="outline"
              onClick={() => {
                onLocate(event.lat, event.lng, event);
                onOpenChange(false);
              }}
            >
              <MapPin />
              Найти на карте
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function StatsDashboard({
  onRefreshEvents,
  onLocate,
}: StatsDashboardProps = {}) {
  const {
    data: stats,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useStatistics();

  // Состояние открытия диалога с деталями последнего события
  const [lastEventOpen, setLastEventOpen] = useState(false);

  // Показываем toast при ошибке загрузки статистики
  useEffect(() => {
    if (!isError) return;
    toast.error("Ошибка загрузки статистики", {
      description: "Не удалось получить данные с сервера",
    });
  }, [isError, refetch]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-heading">Карта событий</h1>
        <Button
          variant="ghost"
          onClick={() => {
            void refetch();
            onRefreshEvents?.();
          }}
          disabled={isFetching}
          aria-label="Обновить данные"
        >
          <RefreshCw className={`${isFetching ? "animate-spin" : ""}`} />
          Обновить
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Всего событий"
          value={stats ? stats.totalEvents.toLocaleString("ru-RU") : "—"}
          icon={Activity}
          loading={isLoading}
        />
        <StatCard
          title="Средняя скорость"
          value={stats ? formatSpeed(stats.averageSpeed) : "—"}
          icon={Gauge}
          loading={isLoading}
        />
        <StatCard
          title="Максимальная скорость"
          value={stats ? formatSpeed(stats.maxSpeed) : "—"}
          icon={TrendingUp}
          loading={isLoading}
        />
        {/* Карточка последнего события кликабельна — открывает диалог с деталями */}
        <div
          onClick={() => stats?.lastEvent && setLastEventOpen(true)}
          className={stats?.lastEvent ? "cursor-pointer" : undefined}
        >
          <StatCard
            title="Последнее событие"
            value={
              stats?.lastEvent
                ? formatDate(stats.lastEvent.createdAt)
                : "Нет данных"
            }
            icon={Clock}
            loading={isLoading}
          />
        </div>
        {stats?.lastEvent && (
          <LastEventDialog
            event={stats.lastEvent}
            open={lastEventOpen}
            onOpenChange={setLastEventOpen}
            onLocate={onLocate}
          />
        )}
      </div>
    </div>
  );
}
