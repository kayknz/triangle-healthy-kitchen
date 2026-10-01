import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

export type PhoneChannel = 'email' | 'whatsapp';

export function getCountryOptions(locale = 'en') {
  const names = new Intl.DisplayNames([locale], { type: 'region' });
  return getCountries()
    .map((country) => ({
      country,
      name: names.of(country) || country,
      dialCode: `+${getCountryCallingCode(country)}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

export function toE164Phone(value: string, country: CountryCode): string | null {
  const parsed = parsePhoneNumberFromString(value.trim(), country);
  return parsed?.isValid() ? parsed.number : null;
}
