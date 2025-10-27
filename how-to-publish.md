# Como Publicar seu Projeto no GitHub

Para publicar o código deste projeto em um repositório no GitHub, siga os passos abaixo. Estas instruções assumem que você tem o [Git](https://git-scm.com/downloads) instalado na sua máquina e uma conta no [GitHub](https://github.com/).

### Passo 1: Inicialize um Repositório Git Localmente

Abra um terminal na pasta raiz do seu projeto e execute os seguintes comandos:

1.  **Inicialize o Git:**
    ```bash
    git init
    ```

2.  **Adicione todos os arquivos ao staging:**
    ```bash
    git add .
    ```

3.  **Faça o primeiro commit:**
    ```bash
    git commit -m "Initial commit"
    ```

### Passo 2: Crie um Novo Repositório no GitHub

1.  Vá para o [GitHub](https://github.com/) e faça login.
2.  Clique no ícone de `+` no canto superior direito e selecione **"New repository"**.
3.  Dê um nome ao seu repositório (ex: `paintflow-app`).
4.  Certifique-se de que o repositório seja **público** ou **privado**, conforme sua preferência.
5.  **Importante**: NÃO marque as opções "Add a README file", "Add .gitignore" ou "Choose a license", pois seu projeto já possui esses arquivos.
6.  Clique em **"Create repository"**.

### Passo 3: Conecte seu Repositório Local ao GitHub e Envie o Código

Na página do seu novo repositório no GitHub, você verá uma seção chamada **"…or push an existing repository from the command line"**. Copie e cole os comandos fornecidos no seu terminal. Eles serão parecidos com os seguintes:

```bash
# Substitua a URL pela URL do seu repositório
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git

# Renomeia a branch principal para "main" (padrão atual)
git branch -M main

# Envia o seu código para o GitHub
git push -u origin main
```

Após executar esses comandos, atualize a página do seu repositório no GitHub. Você deverá ver todos os arquivos do seu projeto lá!
