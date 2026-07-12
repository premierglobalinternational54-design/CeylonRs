import { Link } from 'react-router-dom';

export function Logo({ size = 'md', showText = true }: { size?: 'sm' | 'md' | 'lg'; showText?: boolean }) {
  const sizes = { sm: 'h-8 w-8', md: 'h-9 w-9', lg: 'h-12 w-12' };
  const text = { sm: 'text-base', md: 'text-lg', lg: 'text-2xl' };
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className={`${sizes[size]} relative shrink-0`}>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-300" />
        <div className="absolute inset-0 bg-gradient-to-tr from-gold-400 to-gold-600 rounded-xl -rotate-3 group-hover:-rotate-6 transition-transform duration-300 opacity-80" />
        <div className="absolute inset-0 flex items-center justify-center text-bg-base font-extrabold text-lg">
          C
        </div>
      </div>
      {showText && (
        <span className={`${text[size]} font-extrabold tracking-tight text-white`}>
          Ceylon<span className="text-gradient-brand">RS</span>
        </span>
      )}
    </Link>
  );
}
