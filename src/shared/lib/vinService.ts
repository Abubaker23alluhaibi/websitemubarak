/**
 * VIN Decoder & Federal Vehicle Verification Service
 * Integrates with NHTSA vPIC API (National Highway Traffic Safety Administration)
 * Vehicle history is not provided by this decoder.
 */

export interface VinDecodedData {
  vin: string;
  isValid: boolean;
  make: string;
  model: string;
  year: number;
  trim?: string;
  bodyClass?: string;
  vehicleType?: string;
  displacementL?: string;
  displacementCc?: string;
  engineCylinders?: string;
  engineConfiguration?: string;
  fuelType?: string;
  horsepower?: string;
  driveType?: string;
  transmissionStyle?: string;
  plantCountry?: string;
  plantState?: string;
  plantCity?: string;
  manufacturerName?: string;
  gvwr?: string; // Gross Vehicle Weight Rating
  rawErrorCode?: string;
  rawErrorText?: string;
  titleCheck?: {
    cleanTitle: boolean | null;
    floodDamage: boolean | null;
    salvageOrTotalLoss: boolean | null;
    odometerStatus: 'ACTUAL' | 'EXEMPT' | 'TAMPERED' | null;
    recordedMiles?: number | null;
    accidentHistoryCount: number | null;
    nmvtisVerified: boolean;
  };
}

export const POPULAR_DEMO_VINS = [
  {
    label: 'تويوتا كامري (Toyota Camry 2023)',
    vin: '4T1B11HK5PU123456',
    desc: 'سيدان - تجميع أمريكا',
  },
  {
    label: 'هوندا أكورد (Honda Accord 2017)',
    vin: '1HGCR2F83HA000000',
    desc: 'سيدان - أوهايو أمريكا',
  },
  {
    label: 'فورد F-150 (Ford F-150 2022)',
    vin: '1FTFW1ED5NFA12345',
    desc: 'بيك أب - ميشيغان',
  },
  {
    label: 'تسلا موديل Y (Tesla Model Y 2023)',
    vin: '7SAYGDEE9PA123456',
    desc: 'كهربائية - تكساس',
  },
];

/**
 * دالة فك تشفير رقم الشاصي من API هيئة سلامة المرور الأمريكية الحكومية NHTSA
 * الرابط مجاني 100% ومفتوح بدون اشتراك أو مفتاح API
 */
export async function decodeVinFromNHTSA(vin: string): Promise<VinDecodedData> {
  const cleanVin = vin.toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (!cleanVin || cleanVin.length < 11) {
    throw new Error('رقم الشاصي يجب أن يتكون من 11 إلى 17 حرفاً ورقم');
  }

  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${cleanVin}?format=json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`تعذر الاتصال بخوادم NHTSA (رمز الخطأ: ${response.status})`);
    }

    const data = await response.json();
    const results: Array<{ Variable: string; Value: string | null }> = data.Results || [];

    const getField = (varName: string): string => {
      const item = results.find((r) => r.Variable === varName);
      if (!item || !item.Value || item.Value === 'null' || item.Value === 'Not Applicable') {
        return '';
      }
      return item.Value.trim();
    };

    const make = getField('Make');
    const model = getField('Model');
    const modelYear = parseInt(getField('Model Year'), 10) || new Date().getFullYear();

    // No vehicle history provider is connected. Unknown is not a clean result.
    const titleCheck = {
      cleanTitle: null, floodDamage: null, salvageOrTotalLoss: null,
      odometerStatus: null, recordedMiles: null, accidentHistoryCount: null,
      nmvtisVerified: false,
    };

    return {
      vin: cleanVin,
      isValid: Boolean(make && model),
      make: make || 'غير محدد',
      model: model || 'غير محدد',
      year: modelYear,
      trim: getField('Trim') || getField('Series'),
      bodyClass: getField('Body Class'),
      vehicleType: getField('Vehicle Type'),
      displacementL: getField('Displacement (L)'),
      displacementCc: getField('Displacement (CC)'),
      engineCylinders: getField('Engine Number of Cylinders'),
      engineConfiguration: getField('Engine Configuration'),
      fuelType: getField('Fuel Type - Primary'),
      horsepower: getField('Engine Brake (hp) From') || getField('Engine Brake (hp) To'),
      driveType: getField('Drive Type'),
      transmissionStyle: getField('Transmission Style'),
      plantCountry: getField('Plant Country'),
      plantState: getField('Plant State'),
      plantCity: getField('Plant City'),
      manufacturerName: getField('Manufacturer Name'),
      gvwr: getField('Gross Vehicle Weight Rating From') || getField('GVWR'),
      rawErrorCode: getField('Error Code'),
      rawErrorText: getField('Error Text'),
      titleCheck,
    };
  } catch (error: any) {
    console.error('NHTSA API Decode Error:', error);
    throw new Error(error?.message || 'حدث خطأ أثناء فك تشفير رقم الشاصي');
  }
}
