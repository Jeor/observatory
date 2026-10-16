export type OrbitRotation={x:number;y:number};
// Yaw is applied before pitch in the projection. Once pitch passes a pole,
// its screen direction flips; compensate for both pointer input and inertia.
export function orbitStep(rotation:OrbitRotation,horizontal:number,vertical:number):OrbitRotation{
 const direction=Math.cos(rotation.x)<0?-1:1;
 return {x:rotation.x+vertical,y:rotation.y+horizontal*direction};
}
