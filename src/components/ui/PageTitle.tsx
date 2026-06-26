type PageTitleProps = {
  title: string;
  subtitle?: string;
};

export function PageTitle({ subtitle, title }: PageTitleProps) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
    </div>
  );
}
