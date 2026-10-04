type SectionHeadingProps = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
};

export function SectionHeading({
  id,
  eyebrow,
  title,
  subtitle,
}: SectionHeadingProps) {
  return (
    <header className="section__head">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="section__title" id={`${id}-title`}>
        {title}
      </h2>
      {subtitle ? <p className="section__subtitle">{subtitle}</p> : null}
    </header>
  );
}