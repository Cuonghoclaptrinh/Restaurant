
const RESERVATION_SERVICE_URL =
    process.env.RESERVATION_SERVICE_URL || 'http://reservation-service:3002'

async function setTableStatus(tableId, status) {
    if (!tableId) return

    try {
        const url = `${RESERVATION_SERVICE_URL}/tables/${tableId}/status`
        console.log(`[ORDER → RESERVATION] PATCH ${url} (${status})`)

        const resp = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                
            },
            body: JSON.stringify({ status }),
        })

        if (!resp.ok) {
            const text = await resp.text()
            console.error(
                `❌ setTableStatus FAILED (HTTP ${resp.status}):`,
                text
            )
        } else {
            console.log(`✅ Bàn #${tableId} cập nhật thành công → ${status}`)
        }
    } catch (err) {
        console.error('❌ Không gọi được reservation-service:', err.message)
    }
}

module.exports = { setTableStatus }