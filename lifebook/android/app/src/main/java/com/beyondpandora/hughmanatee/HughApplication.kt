package com.beyondpandora.hughmanatee

import android.app.Application

class HughApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Database and DataStore init happens lazily on first access
    }
}
