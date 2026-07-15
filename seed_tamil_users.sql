-- Seed 100 Test Users with Tamil Names and Profiles
DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT;
    v_name TEXT;
    v_username TEXT;
    tamil_first_names TEXT[] := ARRAY['Karthik', 'Arun', 'Surya', 'Vikram', 'Prakash', 'Rajesh', 'Siva', 'Vijay', 'Manoj', 'Dinesh', 'Ashok', 'Sanjay', 'Vignesh', 'Prabhu', 'Ramesh', 'Suresh', 'Murali', 'Gopi', 'Bala', 'Senthil', 'Deepak', 'Sathish', 'Naveen', 'Anand', 'Ganesh', 'Hari', 'Saravanan', 'Manikandan', 'Prashanth', 'Nithya', 'Priya', 'Kavitha', 'Divya', 'Deepa', 'Swathi', 'Ramya', 'Anitha', 'Karthika', 'Sowmya', 'Sangeetha', 'Gowri', 'Vidya', 'Geetha', 'Meena', 'Saranya', 'Nandhini', 'Preethi', 'Kirthika', 'Gayathri', 'Aarthi'];
    tamil_last_names TEXT[] := ARRAY['Raman', 'Kumar', 'Raj', 'Krishnan', 'Natarajan', 'Subramanian', 'Rajan', 'Pillai', 'Iyer', 'Reddy', 'Gounder', 'Naidu', 'Chettiar', 'Thevar', 'Swamy', 'Murugan'];
    i INTEGER;
    fn TEXT;
    ln TEXT;
BEGIN
    FOR i IN 1..100 LOOP
        v_user_id := gen_random_uuid();
        fn := tamil_first_names[1 + floor(random() * array_length(tamil_first_names, 1))];
        ln := tamil_last_names[1 + floor(random() * array_length(tamil_last_names, 1))];
        v_name := fn || ' ' || ln;
        v_username := substr(lower(fn) || lower(ln), 1, 16) || floor(random() * 1000)::text;
        v_email := v_username || '@example.com';
        
        -- Insert into auth.users (This triggers handle_new_user which creates the profile)
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at, 
            raw_user_meta_data, created_at, updated_at, role, raw_app_meta_data
        ) VALUES (
            v_user_id, '00000000-0000-0000-0000-000000000000', v_email, 
            crypt('password123', gen_salt('bf')), NOW(), 
            jsonb_build_object('full_name', v_name, 'username', v_username),
            NOW(), NOW(), 'authenticated', '{"provider": "email", "providers": ["email"]}'::jsonb
        );
        
        -- Update the profile created by the trigger with Tamil display name and username
        UPDATE public.profiles 
        SET 
            display_name = v_name,
            username = v_username
        WHERE user_id = v_user_id;
        
    END LOOP;
END $$;
