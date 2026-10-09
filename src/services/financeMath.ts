export function parseAmount(value:string):number {
 if(!/^\d{1,12}([.,]\d{1,2})?$/.test(value.trim()))throw new Error('Ingresá un importe positivo, con hasta dos decimales y sin separador de miles.')
 const [whole,fraction='']=value.trim().replace(',','.').split('.')
 const cents=Number(whole)*100+Number(fraction.padEnd(2,'0'))
 if(cents<=0)throw new Error('El importe debe ser mayor que cero.')
 return cents/100
}
export function summarize(rows:{kind:string;amount:number;voided_at:string|null}[]){
 let income=0,expense=0
 for(const row of rows)if(!row.voided_at){const cents=Math.round(Number(row.amount)*100);if(row.kind==='income')income+=cents;else expense+=cents}
 return {income:income/100,expense:expense/100,balance:(income-expense)/100}
}
export function csvCell(value:unknown){const s=String(value??'');return '"'+(/^[\s]*[=+\-@]/.test(s)?"'"+s:s).replaceAll('"','""')+'"'}
