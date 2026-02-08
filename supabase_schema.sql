-- Create a table for user profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  usage_count integer default 0,
  is_paid boolean default false,
  stripe_customer_id text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create a table for payments
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  amount integer not null,
  provider text not null, -- 'midtrans', 'xendit'
  transaction_id text not null,
  status text not null, -- 'pending', 'success', 'failed'
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for payments
alter table public.payments enable row level security;

create policy "Users can view their own payments."
  on payments for select
  using ( auth.uid() = user_id );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
