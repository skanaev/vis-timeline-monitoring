interface LoaderProps {
  label?: string;
}

export const Loader = ({ label = 'Загрузка данных...' }: LoaderProps): JSX.Element => {
  return (
    <div role="status" aria-live="polite">
      {label}
    </div>
  );
};
