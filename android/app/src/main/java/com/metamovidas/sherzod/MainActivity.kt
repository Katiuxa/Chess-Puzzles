package com.metamovidas.sherzod

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowCompat
import coil.Coil
import coil.ImageLoader
import coil.decode.SvgDecoder
import com.metamovidas.sherzod.ui.SherzodApp
import com.metamovidas.sherzod.ui.theme.SherzodTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        WindowCompat.setDecorFitsSystemWindows(window, false)
        Coil.setImageLoader(
            ImageLoader.Builder(this)
                .components { add(SvgDecoder.Factory()) }
                .build(),
        )
        setContent {
            SherzodTheme { SherzodApp() }
        }
    }
}
