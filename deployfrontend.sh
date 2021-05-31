rsync -r src/ docs/
rsync -r build/contracts/* docs/
git add .
git commit -m "Compiles asset for website"
git push
