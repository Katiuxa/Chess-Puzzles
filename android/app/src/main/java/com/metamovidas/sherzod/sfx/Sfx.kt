package com.metamovidas.sherzod.sfx

import android.content.Context
import android.media.AudioAttributes
import android.media.SoundPool
import android.os.SystemClock
import com.metamovidas.sherzod.R

enum class Sfx { Select, Move, Capture }

class SfxPlayer(context: Context) {
    private val pool: SoundPool = SoundPool.Builder()
        .setMaxStreams(1)
        .setAudioAttributes(
            AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_GAME)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build(),
        )
        .build()

    private val ids: Map<Sfx, Int> = mapOf(
        Sfx.Select to pool.load(context, R.raw.select, 1),
        Sfx.Move to pool.load(context, R.raw.move, 1),
        Sfx.Capture to pool.load(context, R.raw.capture, 1),
    )

    private var streamId = 0
    private var lastAt = 0L
    private var lastSfx: Sfx? = null

    fun play(sfx: Sfx) {
        val now = SystemClock.uptimeMillis()
        if (sfx == lastSfx && now - lastAt < 90L) return
        lastAt = now
        lastSfx = sfx
        val id = ids[sfx] ?: return
        val vol = when (sfx) {
            Sfx.Select -> 0.22f
            Sfx.Move -> 0.28f
            Sfx.Capture -> 0.32f
        }
        if (streamId != 0) pool.stop(streamId)
        streamId = pool.play(id, vol, vol, 1, 0, 1f)
    }

    fun release() {
        pool.release()
    }
}
