import { CheckCircle, Circle, Clock, XCircle, Camera, ImageIcon, Package, Calendar, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

export type WorkflowStatus = 
  | "pending_payment" 
  | "payment_confirmed" 
  | "scheduled" 
  | "shooting" 
  | "processing" 
  | "editing_complete" 
  | "delivered" 
  | "cancelled";

interface WorkflowStep {
  id: WorkflowStatus;
  label: string;
  icon: React.ElementType;
  timestamp?: string | null;
}

interface BookingWorkflowTimelineProps {
  currentStatus: WorkflowStatus;
  timestamps: {
    created_at?: string | null;
    payment_confirmed_at?: string | null;
    scheduled_at?: string | null;
    shooting_at?: string | null;
    processing_at?: string | null;
    editing_complete_at?: string | null;
    delivered_at?: string | null;
    cancelled_at?: string | null;
  };
  hasPaymentProof?: boolean;
  compact?: boolean;
}

const workflowSteps: WorkflowStep[] = [
  { id: "pending_payment", label: "Đặt lịch", icon: Calendar },
  { id: "payment_confirmed", label: "Đã thanh toán", icon: CreditCard },
  { id: "scheduled", label: "Đã lên lịch", icon: Clock },
  { id: "shooting", label: "Đang chụp", icon: Camera },
  { id: "processing", label: "Đang xử lý", icon: ImageIcon },
  { id: "editing_complete", label: "Hoàn tất chỉnh sửa", icon: CheckCircle },
  { id: "delivered", label: "Đã bàn giao", icon: Package },
];

const getStepIndex = (status: WorkflowStatus): number => {
  if (status === "cancelled") return -1;
  return workflowSteps.findIndex(step => step.id === status);
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const BookingWorkflowTimeline = ({
  currentStatus,
  timestamps,
  hasPaymentProof,
  compact = false,
}: BookingWorkflowTimelineProps) => {
  const currentIndex = getStepIndex(currentStatus);
  const isCancelled = currentStatus === "cancelled";

  const getTimestampForStep = (stepId: WorkflowStatus): string | null | undefined => {
    switch (stepId) {
      case "pending_payment":
        return timestamps.created_at;
      case "payment_confirmed":
        return timestamps.payment_confirmed_at;
      case "scheduled":
        return timestamps.scheduled_at;
      case "shooting":
        return timestamps.shooting_at;
      case "processing":
        return timestamps.processing_at;
      case "editing_complete":
        return timestamps.editing_complete_at;
      case "delivered":
        return timestamps.delivered_at;
      default:
        return null;
    }
  };

  if (isCancelled) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <XCircle className="h-8 w-8 text-red-500" />
          <div>
            <p className="font-semibold text-red-700">Đã hủy</p>
            {timestamps.cancelled_at && (
              <p className="text-sm text-red-600">
                {formatDate(timestamps.cancelled_at)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {workflowSteps.map((step, index) => {
          const stepIndex = index;
          const isCompleted = stepIndex < currentIndex;
          const isCurrent = stepIndex === currentIndex;
          const isPending = stepIndex === 0 && currentStatus === "pending_payment" && !hasPaymentProof;

          return (
            <div 
              key={step.id}
              className={cn(
                "flex items-center gap-1",
                index < workflowSteps.length - 1 && "mr-1"
              )}
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                  isCompleted && "bg-green-500 text-white",
                  isCurrent && !isPending && "bg-primary text-primary-foreground",
                  isPending && "bg-yellow-500 text-white animate-pulse",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
                title={step.label}
              >
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <step.icon className="h-3 w-3" />
                )}
              </div>
              {index < workflowSteps.length - 1 && (
                <div 
                  className={cn(
                    "w-4 h-0.5",
                    stepIndex < currentIndex ? "bg-green-500" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
        Tiến độ xử lý
      </h4>
      <div className="relative">
        {workflowSteps.map((step, index) => {
          const stepIndex = index;
          const isCompleted = stepIndex < currentIndex;
          const isCurrent = stepIndex === currentIndex;
          const isPending = stepIndex === 0 && currentStatus === "pending_payment" && !hasPaymentProof;
          const timestamp = getTimestampForStep(step.id);

          return (
            <div key={step.id} className="flex items-start gap-4 pb-6 last:pb-0">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    isCompleted && "bg-green-500 border-green-500 text-white",
                    isCurrent && !isPending && "bg-primary border-primary text-primary-foreground",
                    isPending && "bg-yellow-500 border-yellow-500 text-white animate-pulse",
                    !isCompleted && !isCurrent && "bg-background border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                {index < workflowSteps.length - 1 && (
                  <div 
                    className={cn(
                      "w-0.5 flex-1 min-h-[24px]",
                      stepIndex < currentIndex ? "bg-green-500" : "bg-muted"
                    )}
                  />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 pt-2">
                <p
                  className={cn(
                    "font-medium",
                    isCompleted && "text-green-700",
                    isCurrent && "text-primary",
                    isPending && "text-yellow-700",
                    !isCompleted && !isCurrent && "text-muted-foreground"
                  )}
                >
                  {step.label}
                  {isPending && (
                    <span className="ml-2 text-xs font-normal text-yellow-600">
                      (Chờ thanh toán - tự động hủy sau 24h)
                    </span>
                  )}
                </p>
                {timestamp && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {formatDate(timestamp)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
