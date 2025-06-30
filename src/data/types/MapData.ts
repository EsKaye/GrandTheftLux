/**
 * 🗺️ Map Data Type Definitions
 * 
 * Comprehensive type definitions for:
 * - NYC street network data
 * - Building and landmark information
 * - District and neighborhood boundaries
 * - Traffic and transportation data
 * - Weather and environmental data
 */

export interface StreetData {
  id: string;
  name: string;
  type: StreetType;
  coordinates: { lat: number; lng: number }[];
  lanes: number;
  speedLimit: number; // km/h
  oneWay: boolean;
  surface: StreetSurface;
  elevation: number;
  width: number; // meters
  length: number; // meters
  trafficLight: boolean;
  stopSign: boolean;
  crosswalk: boolean;
  bikeLane: boolean;
  busLane: boolean;
  parking: boolean;
  description?: string;
}

export enum StreetType {
  HIGHWAY = 'highway',
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  TERTIARY = 'tertiary',
  RESIDENTIAL = 'residential',
  SERVICE = 'service',
  PEDESTRIAN = 'pedestrian',
  BRIDGE = 'bridge',
  TUNNEL = 'tunnel',
  RAMP = 'ramp'
}

export enum StreetSurface {
  ASPHALT = 'asphalt',
  CONCRETE = 'concrete',
  COBBLESTONE = 'cobblestone',
  GRAVEL = 'gravel',
  DIRT = 'dirt',
  BRICK = 'brick'
}

export interface BuildingData {
  id: string;
  name: string;
  type: BuildingType;
  coordinates: { lat: number; lng: number };
  height: number; // meters
  floors: number;
  yearBuilt: number;
  zoning: string;
  occupancy: number;
  value: number;
  interior: boolean;
  enterable: boolean;
  description?: string;
  architect?: string;
  style?: string;
  landmark: boolean;
  historical: boolean;
}

export enum BuildingType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  OFFICE = 'office',
  HOTEL = 'hotel',
  RESTAURANT = 'restaurant',
  RETAIL = 'retail',
  EDUCATIONAL = 'educational',
  HEALTHCARE = 'healthcare',
  GOVERNMENT = 'government',
  RELIGIOUS = 'religious',
  ENTERTAINMENT = 'entertainment',
  TRANSPORTATION = 'transportation',
  UTILITY = 'utility'
}

export interface LandmarkData {
  id: string;
  name: string;
  type: LandmarkType;
  coordinates: { lat: number; lng: number };
  height: number; // meters
  description: string;
  historical: boolean;
  touristAttraction: boolean;
  accessibility: boolean;
  parking: boolean;
  publicTransport: boolean;
  website?: string;
  phone?: string;
  hours?: string;
  admission?: string;
}

export enum LandmarkType {
  SKYSCRAPER = 'skyscraper',
  MONUMENT = 'monument',
  PARK = 'park',
  BRIDGE = 'bridge',
  TUNNEL = 'tunnel',
  STADIUM = 'stadium',
  MUSEUM = 'museum',
  THEATER = 'theater',
  CHURCH = 'church',
  LIBRARY = 'library',
  HOSPITAL = 'hospital',
  SCHOOL = 'school',
  STATION = 'station',
  AIRPORT = 'airport',
  PORT = 'port'
}

export interface DistrictData {
  id: string;
  name: string;
  type: DistrictType;
  coordinates: { lat: number; lng: number }[];
  population: number;
  area: number; // square kilometers
  density: number; // people per square kilometer
  description: string;
  crimeRate: number; // 0-1
  incomeLevel: IncomeLevel;
  educationLevel: EducationLevel;
  diversity: number; // 0-1
  walkability: number; // 0-1
  transitScore: number; // 0-1
  bikeScore: number; // 0-1
}

export enum DistrictType {
  BOROUGH = 'borough',
  NEIGHBORHOOD = 'neighborhood',
  BUSINESS_DISTRICT = 'business_district',
  RESIDENTIAL_AREA = 'residential_area',
  INDUSTRIAL_ZONE = 'industrial_zone',
  PARK = 'park',
  CAMPUS = 'campus',
  AIRPORT = 'airport',
  PORT = 'port'
}

export enum IncomeLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

export enum EducationLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

export interface TrafficData {
  id: string;
  location: { lat: number; lng: number };
  congestionLevel: number; // 0-1
  averageSpeed: number; // km/h
  incidents: number;
  timestamp: number;
  weather: WeatherCondition;
  timeOfDay: TimeOfDay;
  dayOfWeek: DayOfWeek;
  specialEvent: boolean;
  construction: boolean;
}

export enum WeatherCondition {
  CLEAR = 'clear',
  CLOUDY = 'cloudy',
  RAIN = 'rain',
  SNOW = 'snow',
  FOG = 'fog',
  STORM = 'storm',
  WINDY = 'windy'
}

export enum TimeOfDay {
  EARLY_MORNING = 'early_morning',
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  NIGHT = 'night',
  LATE_NIGHT = 'late_night'
}

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday'
}

export interface WeatherData {
  id: string;
  location: { lat: number; lng: number };
  temperature: number; // Celsius
  humidity: number; // 0-100
  windSpeed: number; // km/h
  windDirection: number; // degrees
  precipitation: number; // mm/h
  visibility: number; // km
  pressure: number; // hPa
  uvIndex: number; // 0-11
  timestamp: number;
  forecast: WeatherForecast[];
}

export interface WeatherForecast {
  timestamp: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  condition: WeatherCondition;
}

export interface TransportationData {
  id: string;
  type: TransportationType;
  name: string;
  coordinates: { lat: number; lng: number };
  lines: string[];
  frequency: number; // minutes
  capacity: number;
  accessibility: boolean;
  operatingHours: string;
  fare: number;
  description?: string;
}

export enum TransportationType {
  SUBWAY = 'subway',
  BUS = 'bus',
  TRAIN = 'train',
  FERRY = 'ferry',
  TAXI = 'taxi',
  BIKE_SHARE = 'bike_share',
  SCOOTER = 'scooter',
  CABLE_CAR = 'cable_car'
}

export interface ParkingData {
  id: string;
  name: string;
  type: ParkingType;
  coordinates: { lat: number; lng: number };
  capacity: number;
  available: number;
  hourlyRate: number;
  dailyRate: number;
  accessible: boolean;
  covered: boolean;
  security: boolean;
  hours: string;
  paymentMethods: string[];
}

export enum ParkingType {
  STREET = 'street',
  LOT = 'lot',
  GARAGE = 'garage',
  UNDERGROUND = 'underground',
  VALET = 'valet',
  RESERVED = 'reserved'
}

export interface EmergencyData {
  id: string;
  type: EmergencyType;
  name: string;
  coordinates: { lat: number; lng: number };
  phone: string;
  hours: string;
  services: string[];
  capacity: number;
  responseTime: number; // minutes
  description?: string;
}

export enum EmergencyType {
  POLICE = 'police',
  FIRE = 'fire',
  HOSPITAL = 'hospital',
  AMBULANCE = 'ambulance',
  EMERGENCY_ROOM = 'emergency_room',
  PHARMACY = 'pharmacy'
}

export interface EventData {
  id: string;
  name: string;
  type: EventType;
  coordinates: { lat: number; lng: number };
  startTime: number;
  endTime: number;
  attendance: number;
  description: string;
  organizer: string;
  website?: string;
  ticketPrice?: number;
  accessibility: boolean;
  parking: boolean;
  publicTransport: boolean;
}

export enum EventType {
  CONCERT = 'concert',
  SPORTS = 'sports',
  FESTIVAL = 'festival',
  CONFERENCE = 'conference',
  EXHIBITION = 'exhibition',
  PARADE = 'parade',
  PROTEST = 'protest',
  CEREMONY = 'ceremony'
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapTile {
  x: number;
  y: number;
  zoom: number;
  data: any;
  timestamp: number;
}

export interface MapLayer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  opacity: number;
  data: any[];
  style: LayerStyle;
}

export enum LayerType {
  STREETS = 'streets',
  BUILDINGS = 'buildings',
  LANDMARKS = 'landmarks',
  TRAFFIC = 'traffic',
  WEATHER = 'weather',
  TRANSPORTATION = 'transportation',
  PARKING = 'parking',
  EMERGENCY = 'emergency',
  EVENTS = 'events'
}

export interface LayerStyle {
  color: string;
  size: number;
  opacity: number;
  outline: boolean;
  outlineColor: string;
  outlineWidth: number;
  icon?: string;
  label?: boolean;
  labelColor?: string;
  labelSize?: number;
}

export interface MapFilter {
  id: string;
  name: string;
  type: FilterType;
  enabled: boolean;
  conditions: FilterCondition[];
}

export enum FilterType {
  RANGE = 'range',
  CATEGORY = 'category',
  BOOLEAN = 'boolean',
  TEXT = 'text',
  DATE = 'date'
}

export interface FilterCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
  value: any;
}

export interface MapSearchResult {
  id: string;
  type: 'street' | 'building' | 'landmark' | 'district';
  name: string;
  coordinates: { lat: number; lng: number };
  relevance: number; // 0-1
  description?: string;
}

export interface MapStatistics {
  totalStreets: number;
  totalBuildings: number;
  totalLandmarks: number;
  totalDistricts: number;
  averageBuildingHeight: number;
  averageStreetWidth: number;
  populationDensity: number;
  trafficCongestion: number; // 0-1
  walkabilityScore: number; // 0-1
  transitScore: number; // 0-1
} 