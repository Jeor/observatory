/** Consistent quantitative bars without browser-specific native meter styling. */
export function MeasureBar({value,max,label,valueText,color}:{color?:string;value:number;max:number;label:string;valueText?:string}){
 const upper=Math.max(1,max);const amount=Math.max(0,Math.min(value,upper));
 return <span className="measure-bar" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={upper} aria-valuenow={amount} aria-valuetext={valueText}><span className="measure-bar-fill" style={{background:color,width:`${amount/upper*100}%`}}/></span>;
}
