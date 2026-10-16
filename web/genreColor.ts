const palette=['#79b6bb','#d5946b','#a8c58e','#b19ac9','#e2c68c','#cb91a0','#8caee1','#d2af87'];
const colors:Record<string,string>={'Unclassified':'#858e87','Game Show':'#a8c58e','Science Fiction':'#79b6bb','Comedy':'#e2c68c','Family':'#b19ac9','Action':'#d5946b','War':'#cb91a0','Drama':'#8caee1','Adventure':'#d2af87','Reality':'#9eada0'};
export const genreColor=(name:string)=>colors[name]||palette[[...name].reduce((sum,c)=>sum+c.charCodeAt(0),0)%palette.length];
