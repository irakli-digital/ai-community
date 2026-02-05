-- Full-text search: add tsvector columns, GIN indexes, and auto-update triggers

-- Add tsvector column to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Add tsvector column to courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Populate existing data
UPDATE posts SET search_vector = to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, ''));
UPDATE courses SET search_vector = to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''));

-- Create GIN indexes
CREATE INDEX IF NOT EXISTS posts_search_vector_idx ON posts USING gin(search_vector);
CREATE INDEX IF NOT EXISTS courses_search_vector_idx ON courses USING gin(search_vector);

-- Create trigger function for posts
CREATE OR REPLACE FUNCTION posts_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple', coalesce(NEW.title, '') || ' ' || coalesce(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for courses
CREATE OR REPLACE FUNCTION courses_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple', coalesce(NEW.title, '') || ' ' || coalesce(NEW.description, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS posts_search_vector_trigger ON posts;
CREATE TRIGGER posts_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, content ON posts
  FOR EACH ROW EXECUTE FUNCTION posts_search_vector_update();

DROP TRIGGER IF EXISTS courses_search_vector_trigger ON courses;
CREATE TRIGGER courses_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, description ON courses
  FOR EACH ROW EXECUTE FUNCTION courses_search_vector_update();
