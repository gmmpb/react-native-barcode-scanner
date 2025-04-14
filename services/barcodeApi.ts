/**
 * Barcode API Service
 *
 * Handles all interactions with the barcode API endpoint.
 * API endpoint: 127.0.0.1:7878/api/barcode
 */

const API_BASE_URL = "http://192.168.1.40:7878/api/barcode/";

export interface BarcodeResponse {
  barcode: string;
  price: number | null;
  exists: boolean;
  message: string | null;
}

/**
 * Retrieves barcode information from the API
 * @param barcode The barcode to retrieve
 * @returns A promise that resolves to the barcode data
 */
export async function getBarcode(barcode: string): Promise<BarcodeResponse> {
  try {
    console.log("Fetching barcode:", barcode); // Debugging line
    const response = await fetch(`${API_BASE_URL}/${barcode}`);
    console.log("Response status:", response.status); // Debugging line
    if (!response.ok) {
      if (response.status === 404) {
        console.log("Barcode not found:", barcode); // Debugging line
        return {
          barcode,
          price: null,
          exists: false,
          message: "Barcode not found",
        };
      }
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching barcode:", error);
    throw error;
  }
}

/**
 * Adds a new barcode with price to the database
 * @param barcode The barcode to add
 * @param price The price associated with the barcode
 * @returns A promise that resolves to the added barcode data
 */
export async function addBarcode(
  barcode: string,
  price: number
): Promise<BarcodeResponse> {
  try {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        barcode,
        price,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error adding barcode:", error);
    throw error;
  }
}
