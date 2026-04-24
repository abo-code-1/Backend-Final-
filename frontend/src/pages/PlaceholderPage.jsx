import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import { Wrench } from "lucide-react";

export default function PlaceholderPage({ title, description }) {
  return (
    <div>
      <PageHeader title={title} subtitle={description} />
      <div className="mt-8">
        <EmptyState
          icon={Wrench}
          title="Страница в разработке"
          description="Мы работаем над этим разделом. Скоро он будет доступен."
        />
      </div>
    </div>
  );
}
