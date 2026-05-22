import { useRef, useState } from "react";
import { Image, Upload, X } from "lucide-react";
import { toast } from "react-toastify";
import { apiClient } from "../../api/client";
import { cn } from "../../utils/cn";
import Button from "./Button";
import Input from "./Input";

export default function ImageUploadField({
  label = "Изображение",
  value,
  onChange,
  className,
}) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Можно загружать только изображения");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    try {
      const { data } = await apiClient.post("/uploads/images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(data.item.url);
      toast.success("Изображение загружено");
    } catch (e) {
      toast.error(e.response?.data?.message || "Не удалось загрузить изображение");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-semibold text-foreground">{label}</label>
        {value && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onChange("")}
            className="h-8 px-2 text-muted-foreground"
          >
            <X size={14} />
            Очистить
          </Button>
        )}
      </div>

      {value ? (
        <div className="aspect-[16/9] overflow-hidden rounded-lg border bg-muted">
          <img
            src={value}
            alt=""
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        </div>
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center rounded-lg border bg-muted text-muted-foreground">
          <Image size={22} />
        </div>
      )}

      <Input
        placeholder="URL появится после загрузки"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={uploadFile}
        />
        <Button
          type="button"
          variant="outline"
          loading={uploading}
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={16} />
          Загрузить файл
        </Button>
        <p className="text-xs text-muted-foreground">JPG, PNG, WebP, GIF до 5 МБ</p>
      </div>
    </div>
  );
}
