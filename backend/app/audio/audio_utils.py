import librosa, numpy as np
import subprocess, tempfile, os
import imageio_ffmpeg

def load_audio_mono(path, sr=16000):
    try:
        audio, orig_sr = librosa.load(path, sr=None, mono=True)
    except Exception:
        # Fallback: transcode (e.g., webm/opus) to wav using ffmpeg, then load.
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp_path = tmp.name
        try:
            ffmpeg_bin = imageio_ffmpeg.get_ffmpeg_exe()
            proc = subprocess.run(
                [ffmpeg_bin, "-y", "-i", path, "-ac", "1", "-ar", str(sr), tmp_path],
                check=False,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            if proc.returncode != 0:
                raise RuntimeError(
                    f"ffmpeg failed to decode audio (status {proc.returncode}): {proc.stderr.decode(errors='ignore') or 'no stderr'}"
                )
            audio, orig_sr = librosa.load(tmp_path, sr=sr, mono=True)
        except FileNotFoundError as e:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
            raise RuntimeError("ffmpeg not found; install ffmpeg to decode webm/opus audio") from e
        except Exception as e:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
            raise
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    if orig_sr != sr:
        audio = librosa.resample(y=audio, orig_sr=orig_sr, target_sr=sr)
    return audio.astype(np.float32), sr
