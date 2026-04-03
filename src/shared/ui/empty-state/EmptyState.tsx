interface EmptyStateProps {
  title: string;
  description: string;
}

export const EmptyState = ({ title, description }: EmptyStateProps): JSX.Element => {
  return (
    <section>
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
};
