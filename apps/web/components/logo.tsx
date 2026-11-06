/** AzaPay logo mark from the supplied redesign demo. Decorative by default. */
export function LogoMark({
 size = 30,
 className = "azapay-mark",
 title,
}: Readonly<{ size?: number; className?: string; title?: string }>) {
 return (
  <svg
   width={size}
   height={Math.round(size * 0.9)}
   viewBox="0 0 40 36"
   fill="currentColor"
   aria-hidden={title ? undefined : true}
   role={title ? "img" : undefined}
   className={className}
  >
   {title ? <title>{title}</title> : null}
   <path d="M1 1c10 .5 16 3 19 9-4 1-7 4-9 8C6 13 3 8 1 1z" />
   <path d="M39 1c-2 9-6 16-12 21-4 3-10 6-17 8 8-2 14-5 17-11 2-6 6-12 12-18z" />
  </svg>
 )
}
