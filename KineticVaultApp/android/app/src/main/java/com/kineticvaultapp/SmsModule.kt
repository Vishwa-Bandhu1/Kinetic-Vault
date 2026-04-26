package com.kineticvaultapp

import android.Manifest
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONArray
import org.json.JSONObject

/**
 * React Native native module that bridges SMS events from Android receivers and
 * services into JavaScript via DeviceEventEmitter.
 */
class SmsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    @Volatile
    private var listenerCount = 0

    init {
        smsModuleInstance = this
    }

    override fun getName(): String = MODULE_NAME

    override fun invalidate() {
        if (smsModuleInstance === this) {
            smsModuleInstance = null
        }
        super.invalidate()
    }

    /**
     * Check if SMS permissions are granted.
     * Callable from JavaScript: NativeModules.SmsModule.checkSmsPermission()
     */
    @ReactMethod
    fun checkSmsPermission(promise: Promise) {
        val receiveGranted = ContextCompat.checkSelfPermission(
            reactApplicationContext,
            Manifest.permission.RECEIVE_SMS
        ) == PackageManager.PERMISSION_GRANTED
        val readGranted = ContextCompat.checkSelfPermission(
            reactApplicationContext,
            Manifest.permission.READ_SMS
        ) == PackageManager.PERMISSION_GRANTED

        promise.resolve(receiveGranted && readGranted)
    }

    @ReactMethod
    fun setAutoScanEnabled(enabled: Boolean, promise: Promise) {
        setAutoScanEnabled(reactApplicationContext, enabled)
        if (enabled) {
            drainPendingSmsEvents()
        }
        promise.resolve(true)
    }

    @ReactMethod
    fun getAutoScanEnabled(promise: Promise) {
        promise.resolve(isAutoScanEnabled(reactApplicationContext))
    }

    @ReactMethod
    fun getDeviceRestrictionInfo(promise: Promise) {
        val params = Arguments.createMap().apply {
            putString("manufacturer", Build.MANUFACTURER)
            putString("model", Build.MODEL)
            putBoolean("isRealmeFamily", isRealmeFamilyDevice())
            putBoolean("notificationListenerEnabled", isNotificationListenerEnabled())
            putBoolean("ignoringBatteryOptimizations", isIgnoringBatteryOptimizations())
        }

        promise.resolve(params)
    }

    @ReactMethod
    fun isIgnoringBatteryOptimizations(promise: Promise) {
        promise.resolve(isIgnoringBatteryOptimizations())
    }

    @ReactMethod
    fun isNotificationListenerEnabled(promise: Promise) {
        promise.resolve(isNotificationListenerEnabled())
    }

    @ReactMethod
    fun openNotificationListenerSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (error: Exception) {
            Log.e(TAG, "Unable to open notification listener settings", error)
            openAppSettings()
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun requestIgnoreBatteryOptimizations(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            promise.resolve(true)
            return
        }

        if (isIgnoringBatteryOptimizations()) {
            promise.resolve(true)
            return
        }

        val packageUri = Uri.parse("package:${reactApplicationContext.packageName}")
        val intents = listOf(
            Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                data = packageUri
            },
            Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS),
            Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = packageUri
            }
        )

        promise.resolve(startFirstAvailableActivity(intents, "battery optimization settings"))
    }

    @ReactMethod
    fun openManufacturerAutoStartSettings(promise: Promise) {
        val intents = buildManufacturerSettingsIntents()
        promise.resolve(startFirstAvailableActivity(intents, "manufacturer background settings"))
    }

    /**
     * Required for React Native event emitter listener management.
     */
    @ReactMethod
    fun addListener(eventName: String) {
        listenerCount += 1
        Log.d(TAG, "JS listener added for $eventName; count=$listenerCount")

        if (eventName == EVENT_SMS_RECEIVED) {
            drainPendingSmsEvents()
        }
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        listenerCount = (listenerCount - count).coerceAtLeast(0)
        Log.d(TAG, "JS listener removed; count=$listenerCount")
    }

    private fun openAppSettings() {
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.parse("package:${reactApplicationContext.packageName}")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        reactApplicationContext.startActivity(intent)
    }

    private fun isIgnoringBatteryOptimizations(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true

        val powerManager = reactApplicationContext.getSystemService(
            Context.POWER_SERVICE
        ) as? PowerManager
        return powerManager?.isIgnoringBatteryOptimizations(
            reactApplicationContext.packageName
        ) == true
    }

    private fun isNotificationListenerEnabled(): Boolean {
        val enabledListeners = Settings.Secure.getString(
            reactApplicationContext.contentResolver,
            "enabled_notification_listeners"
        ) ?: return false

        return enabledListeners
            .split(':')
            .any { component ->
                component.contains(reactApplicationContext.packageName, ignoreCase = true)
            }
    }

    private fun startFirstAvailableActivity(intents: List<Intent>, label: String): Boolean {
        for (intent in intents) {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            try {
                reactApplicationContext.startActivity(intent)
                Log.d(TAG, "Opened $label via ${intent.component ?: intent.action}")
                return true
            } catch (error: Exception) {
                Log.d(TAG, "Unable to open $label via ${intent.component ?: intent.action}")
            }
        }

        return try {
            openAppSettings()
            true
        } catch (error: Exception) {
            Log.e(TAG, "Unable to open app settings fallback for $label", error)
            false
        }
    }

    private fun buildManufacturerSettingsIntents(): List<Intent> {
        val packageUri = Uri.parse("package:${reactApplicationContext.packageName}")
        val manufacturer = Build.MANUFACTURER.lowercase()
        val intents = mutableListOf<Intent>()

        if (
            manufacturer.contains("realme") ||
            manufacturer.contains("oppo") ||
            manufacturer.contains("oneplus")
        ) {
            intents += listOf(
                componentIntent(
                    "com.coloros.safecenter",
                    "com.coloros.safecenter.permission.startup.StartupAppListActivity"
                ),
                componentIntent(
                    "com.coloros.safecenter",
                    "com.coloros.safecenter.startupapp.StartupAppListActivity"
                ),
                componentIntent(
                    "com.oplus.safecenter",
                    "com.oplus.safecenter.permission.startup.StartupAppListActivity"
                ),
                componentIntent(
                    "com.oplus.safecenter",
                    "com.oplus.safecenter.startupapp.StartupAppListActivity"
                ),
                componentIntent(
                    "com.oppo.safe",
                    "com.oppo.safe.permission.startup.StartupAppListActivity"
                ),
                componentIntent(
                    "com.coloros.oppoguardelf",
                    "com.coloros.powermanager.fuelgaue.PowerUsageModelActivity"
                ),
                componentIntent(
                    "com.oplus.battery",
                    "com.oplus.powermanager.fuelgaue.PowerUsageModelActivity"
                ),
                componentIntent(
                    "com.coloros.oppoguardelf",
                    "com.coloros.oppoguardelf.MonitoredPkgActivity"
                ),
                componentIntent(
                    "com.oneplus.security",
                    "com.oneplus.security.chainlaunch.view.ChainLaunchAppListActivity"
                ),
                Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = packageUri
                }
            )
        } else if (
            manufacturer.contains("xiaomi") ||
            manufacturer.contains("redmi") ||
            manufacturer.contains("poco")
        ) {
            intents += listOf(
                componentIntent(
                    "com.miui.securitycenter",
                    "com.miui.permcenter.autostart.AutoStartManagementActivity"
                ),
                Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = packageUri
                }
            )
        }

        if (intents.isEmpty()) {
            intents += Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = packageUri
            }
        }

        return intents
    }

    private fun componentIntent(packageName: String, className: String): Intent {
        return Intent().setComponent(ComponentName(packageName, className))
    }

    private fun drainPendingSmsEvents() {
        if (!canEmitToJs()) return

        val pendingEvents = readPendingEvents(reactApplicationContext)
        if (pendingEvents.isEmpty()) return

        Log.d(TAG, "Draining ${pendingEvents.size} queued SMS event(s) to JS")
        val remainingEvents = mutableListOf<PendingSmsEvent>()

        for (event in pendingEvents) {
            if (!sendSmsToJs(event)) {
                remainingEvents.add(event)
            }
        }

        writePendingEvents(reactApplicationContext, remainingEvents)
    }

    private fun sendSmsToJs(event: PendingSmsEvent): Boolean {
        if (!canEmitToJs()) {
            Log.d(TAG, "React instance/listener unavailable; SMS event will stay queued")
            return false
        }

        val params = Arguments.createMap().apply {
            putString("id", event.id)
            putString("sender", event.sender)
            putString("message", event.message)
            putString("source", event.source)
            putDouble("timestamp", event.timestamp)
        }

        return try {
            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(EVENT_SMS_RECEIVED, params)
            Log.d(
                TAG,
                "Emitted SMS event to JS from ${event.sender} " +
                    "(${event.message.length} chars, source=${event.source})"
            )
            true
        } catch (error: Exception) {
            Log.e(TAG, "Failed to emit SMS event to JS", error)
            false
        }
    }

    private fun canEmitToJs(): Boolean {
        return listenerCount > 0 && reactApplicationContext.hasActiveReactInstance()
    }

    companion object {
        const val SOURCE_BROADCAST_RECEIVER = "broadcast_receiver"
        const val SOURCE_NOTIFICATION_LISTENER = "notification_listener"

        private const val TAG = "SmsModule"
        private const val MODULE_NAME = "SmsModule"
        private const val EVENT_SMS_RECEIVED = "onSmsReceived"
        private const val PREFS_NAME = "kinetic_vault_sms"
        private const val KEY_AUTO_SCAN_ENABLED = "auto_scan_enabled"
        private const val KEY_PENDING_EVENTS = "pending_sms_events"
        private const val KEY_RECENT_EVENTS = "recent_sms_events"
        private const val MAX_PENDING_EVENTS = 25
        private const val DEDUPE_WINDOW_MS = 2 * 60 * 1000L

        @Volatile
        private var smsModuleInstance: SmsModule? = null

        fun shouldCaptureIncomingSms(context: Context): Boolean {
            return isAutoScanEnabled(context) ||
                (smsModuleInstance?.listenerCount ?: 0) > 0
        }

        fun emitSmsEvent(
            context: Context,
            sender: String,
            message: String,
            source: String = SOURCE_BROADCAST_RECEIVER
        ) {
            val appContext = context.applicationContext
            if (!shouldCaptureIncomingSms(appContext)) {
                Log.d(TAG, "SMS event discarded because auto-scan is disabled")
                return
            }

            val now = System.currentTimeMillis()
            val normalizedMessage = message.trim()
            val normalizedSender = sender.trim().ifBlank { "Unknown" }
            val eventKey = buildEventKey(normalizedSender, normalizedMessage)

            if (markDuplicateAndReturnIfSeen(appContext, eventKey, now)) {
                Log.d(TAG, "Duplicate SMS event ignored (source=$source)")
                return
            }

            val event = PendingSmsEvent(
                id = "$now-${normalizedSender.hashCode()}-${normalizedMessage.hashCode()}",
                sender = normalizedSender,
                message = normalizedMessage,
                source = source,
                timestamp = now.toDouble()
            )

            val emitted = smsModuleInstance?.sendSmsToJs(event) == true
            if (!emitted) {
                persistPendingEvent(appContext, event)
                Log.d(TAG, "Queued SMS event for JS delivery (source=$source)")
            }
        }

        fun isAutoScanEnabled(context: Context): Boolean {
            return getPrefs(context).getBoolean(KEY_AUTO_SCAN_ENABLED, false)
        }

        private fun setAutoScanEnabled(context: Context, enabled: Boolean) {
            getPrefs(context)
                .edit()
                .putBoolean(KEY_AUTO_SCAN_ENABLED, enabled)
                .apply()

            if (!enabled) {
                writePendingEvents(context, emptyList())
            }

            Log.d(TAG, "Native SMS auto-scan preference set to $enabled")
        }

        private fun isRealmeFamilyDevice(): Boolean {
            val manufacturer = Build.MANUFACTURER.lowercase()
            val brand = Build.BRAND.lowercase()

            return manufacturer.contains("realme") ||
                manufacturer.contains("oppo") ||
                manufacturer.contains("oneplus") ||
                brand.contains("realme") ||
                brand.contains("oppo") ||
                brand.contains("oneplus")
        }

        private fun getPrefs(context: Context) =
            context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        @Synchronized
        private fun persistPendingEvent(context: Context, event: PendingSmsEvent) {
            val events = readPendingEvents(context)
                .toMutableList()
                .apply { add(event) }
                .takeLast(MAX_PENDING_EVENTS)

            writePendingEvents(context, events)
        }

        @Synchronized
        private fun readPendingEvents(context: Context): List<PendingSmsEvent> {
            val rawEvents = getPrefs(context).getString(KEY_PENDING_EVENTS, "[]") ?: "[]"

            return try {
                val events = JSONArray(rawEvents)
                buildList {
                    for (index in 0 until events.length()) {
                        val item = events.optJSONObject(index) ?: continue
                        val sender = item.optString("sender")
                        val message = item.optString("message")
                        if (sender.isBlank() || message.isBlank()) continue

                        add(
                            PendingSmsEvent(
                                id = item.optString("id"),
                                sender = sender,
                                message = message,
                                source = item.optString("source", SOURCE_BROADCAST_RECEIVER),
                                timestamp = item.optDouble(
                                    "timestamp",
                                    System.currentTimeMillis().toDouble()
                                )
                            )
                        )
                    }
                }
            } catch (error: Exception) {
                Log.e(TAG, "Failed to read queued SMS events", error)
                emptyList()
            }
        }

        @Synchronized
        private fun writePendingEvents(context: Context, events: List<PendingSmsEvent>) {
            val json = JSONArray()
            for (event in events) {
                json.put(
                    JSONObject()
                        .put("id", event.id)
                        .put("sender", event.sender)
                        .put("message", event.message)
                        .put("source", event.source)
                        .put("timestamp", event.timestamp)
                )
            }

            getPrefs(context)
                .edit()
                .putString(KEY_PENDING_EVENTS, json.toString())
                .apply()
        }

        private fun buildEventKey(sender: String, message: String): String {
            val compactMessage = message.replace(Regex("\\s+"), " ").trim().lowercase()
            return "${sender.lowercase()}|$compactMessage".hashCode().toString()
        }

        @Synchronized
        private fun markDuplicateAndReturnIfSeen(
            context: Context,
            eventKey: String,
            now: Long
        ): Boolean {
            val rawEvents = getPrefs(context).getString(KEY_RECENT_EVENTS, "{}") ?: "{}"
            val recentEvents = try {
                JSONObject(rawEvents)
            } catch (_: Exception) {
                JSONObject()
            }

            val cleanedEvents = JSONObject()
            var alreadySeen = false
            val keys = recentEvents.keys()
            while (keys.hasNext()) {
                val key = keys.next()
                val seenAt = recentEvents.optLong(key, 0L)
                if (now - seenAt <= DEDUPE_WINDOW_MS) {
                    cleanedEvents.put(key, seenAt)
                    if (key == eventKey) {
                        alreadySeen = true
                    }
                }
            }

            if (!alreadySeen) {
                cleanedEvents.put(eventKey, now)
            }

            getPrefs(context)
                .edit()
                .putString(KEY_RECENT_EVENTS, cleanedEvents.toString())
                .apply()

            return alreadySeen
        }
    }
}

private data class PendingSmsEvent(
    val id: String,
    val sender: String,
    val message: String,
    val source: String,
    val timestamp: Double
)
