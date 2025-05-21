-- Create a function to handle quiz completion in a transaction
create or replace function complete_quiz_transaction(
  p_user_id uuid,
  p_quiz_id text,
  p_score integer,
  p_total_questions integer,
  p_time_taken integer,
  p_personality_type text,
  p_xp_earned integer
) returns void
language plpgsql
security definer
as $$
declare
  v_profile_id uuid;
begin
  -- Get profile_id for the user
  select id into v_profile_id
  from profiles
  where id = p_user_id;

  if v_profile_id is null then
    raise exception 'Profile not found for user %', p_user_id;
  end if;

  -- Start transaction
  begin
    -- Insert quiz attempt
    insert into quiz_attempts (
      profile_id,
      quiz_id,
      score,
      total_questions,
      time_taken,
      personality_type,
      completed_at
    ) values (
      v_profile_id,
      p_quiz_id,
      p_score,
      p_total_questions,
      p_time_taken,
      p_personality_type,
      now()
    );

    -- Update profile XP
    update profiles
    set 
      xp = xp + p_xp_earned,
      completed_quizzes = array_append(completed_quizzes, p_quiz_id),
      updated_at = now()
    where id = v_profile_id;

    -- Commit transaction
    commit;
  exception
    when others then
      -- Rollback transaction on error
      rollback;
      raise;
  end;
end;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION complete_quiz_transaction TO authenticated; 