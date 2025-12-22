from app.services.interview_analysis import run_cs_pipeline
from app.services.tcs_service import compute_tcs
from app.services.aggregation_service import combine_cs_tcs
from app.services.placement_service import generate_placement_feedback

def evaluate_interview(audio_path, questions):
    cs = run_cs_pipeline(audio_path)
    tcs = compute_tcs(cs["transcript"], questions)
    final = combine_cs_tcs(cs["cs_score"], tcs)
    placement = generate_placement_feedback(cs["transcript"], questions)

    return {
        "transcript": cs["transcript"],
        "cs_score": cs["cs_score"],
        "tcs": tcs,
        "final_score": final,
        "placement_feedback": placement
    }
