import type { ReactNode } from 'react';
import styles from './TimelineLayout.module.css';

interface TimelineLayoutProps {
  header: ReactNode;
  board: ReactNode;
  modal?: ReactNode;
}

export const TimelineLayout = ({ header, board, modal }: TimelineLayoutProps): JSX.Element => {
  return (
    <section className={styles.layout}>
      <header className={styles.header}>{header}</header>
      <section className={styles.board}>{board}</section>
      {modal}
    </section>
  );
};
