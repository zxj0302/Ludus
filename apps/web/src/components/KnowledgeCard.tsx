import { motion } from 'framer-motion';

interface Props {
  title: string;
  children: React.ReactNode;
  icon?: string;
  className?: string;
}

export function KnowledgeCard({ title, children, icon, className = '' }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`knowledge-card ${className}`}
    >
      <h3 className="text-sm font-semibold text-logic-indigo-800 mb-2">
        {icon && <span className="mr-1.5">{icon}</span>}
        {title}
      </h3>
      <div className="text-sm text-logic-indigo-700 leading-relaxed">
        {children}
      </div>
    </motion.div>
  );
}
