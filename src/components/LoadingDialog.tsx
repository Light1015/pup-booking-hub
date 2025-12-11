import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface LoadingDialogProps {
  open: boolean;
  message?: string;
}

const LoadingDialog = ({ open, message = "Đang xử lý..." }: LoadingDialogProps) => {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[300px] flex flex-col items-center justify-center py-8" onInteractOutside={(e) => e.preventDefault()}>
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg font-medium text-center">{message}</p>
      </DialogContent>
    </Dialog>
  );
};

export default LoadingDialog;
