export default async function handler(req, res) {
    try {
        const SUPABASE_URL = "https://nnvsenwzckgmfwfgkxbf.supabase.co";
        const SUPABASE_ANON_KEY = "sb_publishable_pt4F0QVSU4kHqCMP4cw01g_yR5JXbNX";

        // Consulta ligera a Supabase para mantener el proyecto activo
        const response = await fetch(`${SUPABASE_URL}/rest/v1/registrations?select=id&limit=1`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Supabase respondió con error ${response.status}: ${errText}`);
        }

        const data = await response.json();

        return res.status(200).json({
            status: "ok",
            message: "Ping exitoso. La base de datos de Supabase se mantiene activa.",
            timestamp: new Date().toISOString(),
            data
        });
    } catch (error) {
        console.error("Error en ping a Supabase:", error);
        return res.status(500).json({
            status: "error",
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
