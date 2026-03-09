export function streamingCO2(minutes:number){
 return (minutes/60)*40
}

export function storageCO2(gb:number){
 return gb*0.75
}

export function emailCO2(emails:number){
 return emails*4
}

export function textsCO2(texts:number){
 return texts*0.014
}

export function downloadCO2(gb:number,network:string){
 if(network==="mobile"){
  return gb*70
 }
 return gb*15
}

export function scrollingCO2(platform:string,minutes:number){

 const factors:any={
  tiktok:2.63,
  instagram:1.5,
  facebook:0.79,
  youtube:0.46
 }

 return minutes*factors[platform]
}