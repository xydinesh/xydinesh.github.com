import markdown
from datetime import datetime
from jinja2 import Environment, FileSystemLoader


def process_post(posts, template, content, date, title, post):
    with open(f'{content}/{post}') as f:
        text = f.read()
        html = markdown.markdown(text, extensions=['fenced_code', 'tables'])
    content = template.render(title=title, body=html)

    with open(f'build/{title}.html', 'w') as f:
        f.write(content)

    # generate index.html using index.data
    date_object = datetime.strptime(date, '%m/%d/%Y').date()
    if str(date_object.year) not in posts:
        posts[str(date_object.year)] = []
    posts[str(date_object.year)].append({'date': date_object.strftime('%b %d'), 'title': title, 'content': post})
    print (title)


def main():
    posts = {}
    now = {}
    # Use template/posts.html as the template for all pages and posts
    environment = Environment(loader=FileSystemLoader("templates/"))
    template = environment.get_template("post.html")
    # read the index.data file from posts and generate files
    with open('posts/index.data') as f:
        for i in f:
            date, title, post = i.strip().split(',')
            process_post(posts, template, 'posts', date, title, post)

    with open('now/index.data') as f:
        for i in f:
            date, title, post = i.strip().split(',')
            process_post(now, template, 'now', date, title, post)

    # create index.html 
    index_template = environment.get_template('index.html')
    content = index_template.render(posts=posts)
    with open(f'build/index.html', 'w') as f:
        f.write(content)

    index_template = environment.get_template('now.html')
    content = index_template.render(posts=now)
    with open(f'build/now.html', 'w') as f:
        f.write(content)

if __name__ == '__main__':
    main()
