"""Small optional helper for correct Arabic text shaping in Blender.

Install into the Python environment used by Blender:
    pip install arabic-reshaper python-bidi
"""

def shape_arabic(text: str) -> str:
    try:
        import arabic_reshaper
        from bidi.algorithm import get_display
    except ImportError as exc:
        raise RuntimeError(
            "Arabic 3D text needs arabic-reshaper and python-bidi in Blender's Python environment."
        ) from exc

    return get_display(arabic_reshaper.reshape(text))
