import { JwtPayload } from "jsonwebtoken";
export interface CustomJwtPayload extends JwtPayload {
  Id?: string;
  landlordId: {
    Id?: string;
  };
  propertyDetails?: any;
  email?: string;
}
