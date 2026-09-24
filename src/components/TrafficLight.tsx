import type { TrafficLight } from '../types/domain'
export default function TrafficLightDot({value}:{value:TrafficLight}){return <span className={`traffic-dot ${value}`} title={value}/>}