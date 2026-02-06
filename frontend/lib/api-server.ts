import { cookies } from "next/headers";
import axios from "axios";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000").replace(/\/$/, "");

export async function getAuthHeader() {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
        return null;
    }

    const url = `${API_URL}/auth/refresh`;

    try {
        const { data } = await axios.post(
            url,
            {},
            {
                headers: {
                    Cookie: `refreshToken=${refreshToken}`,
                },
            }
        );

        const token = data.data?.accessToken ?? data.accessToken;
        if (!token) return null;

        return { Authorization: `Bearer ${token}` };
    } catch (error: any) {
        console.error(`[serverFetch] Refresh failed at ${url}:`, error.response?.status, error.response?.data || error.message);
        return null;
    }
}

export async function serverFetch(endpoint: string, params: Record<string, any> = {}) {
    const authHeader = await getAuthHeader();

    // If we have a cookie but failed to get authHeader, it means token is invalid/expired
    if (!authHeader) {
        const cookieStore = await cookies();
        if (cookieStore.get("refreshToken")) {
            return {
                success: false,
                error: { message: "Unauthorized", statusCode: 401 }
            };
        }
        // No refresh token at all
        return {
            success: false,
            error: { message: "No token", statusCode: 401 }
        };
    }

    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${API_URL}${normalizedEndpoint}`;

    try {
        const { data } = await axios.get(url, {
            params,
            headers: {
                "Content-Type": "application/json",
                ...authHeader,
            },
        });
        return data;
    } catch (error: any) {
        console.error(`[serverFetch] API call failed for ${url}:`, error.response?.status, error.response?.data || error.message);

        return error.response?.data || {
            success: false,
            error: {
                message: error.message,
                statusCode: error.response?.status || 500
            }
        };
    }
}
