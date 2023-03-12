# Common Lisp Rest API

After reading Paul Graham's "Hackers and Painters", I wanted learn "Common Lisp". I found "lisp-koans" to be a great resource for me to get started.
After completing about 25 lessons of 27 koans, I wanted to try and create a REST api project with lisp. I found creating a REST API to be a difficult
taks because I didn't know much about project structure and how to move forward with a lisp project. Therefore I decided to document the process I folowed
to help someone else to get started. This may not be the best approach but it should help you to get started and move along with a REST API development.

## Installing and Setup Environment.

I'm using `sbcl` as "Common Lisp" implementation and `Quicklisp` for package management. [Lisp Cookbook](https://lispcookbook.github.io/cl-cookbook/getting-started.html#install-quicklisp) `Getting Started` guide provides a good starting point for installing `Lisp` and `Quicklisp` package manager.

```
brew install sbcl
brew install rlwrap
curl -O https://beta.quicklisp.org/quicklisp.lisp
sbcl --load quicklisp.lisp
```

After "Common Lisp" REPL loads

```
(quicklisp-quickstart:install)
(ql:add-to-init-file)
```

In order to install quickproject,

```
(ql:quickload "quickproject")
```

## Create new project

I found that location that I create new project is important if I want to load it from the `sbcl` REPL after I make changes. We are going to create a new project `cl-start` in `~/quicklisp/local-projects` so that `quicklisp` able to discover and load this project without any issues. In addition, we will be using `Hunchentoot`

```
(quickproject:make-project "~/quicklisp/local-projects/cl-start" :depends-on '(hunchentoot))
WARNING: Coercing "~/quicklisp/local-projects/cl-start" to directory
"cl-start"
```

```
$tree ~/quicklisp/local-projects/cl-start
├── README.md
├── cl-start.asd
├── cl-start.lisp
└── package.lisp
```

Since we added project at `~/quicklisp/local-projects` we can load our project with `(ql:quickload "cl-start")`

## Common Lisp REST hello world

Add following code to cl-start.lisp

```
;;;; cl-start.lisp

(in-package #:cl-start)

;; Add a simple prefix dispatcher to the *dispatch-table*
(setq *dispatch-table*
      `(,(create-prefix-dispatcher "/hello" 'hello-page)))

;; Handler functions either return generated Web pages as strings,
;; or write to the output stream returned by write-headers
(defun hello-page ()
  "Hello !")

(defun main ()
  (start (make-instance 'easy-acceptor :port 8080))
  (sb-thread:join-thread (find-if
                          (lambda (th)
                            (string= (sb-thread:thread-name th) "hunchentoot-listener-*:8080"))
                          (sb-thread:list-all-threads))))
```

`package.lisp` contains following

```
;;;; package.lisp
(ql:quickload '(:hunchentoot))

(defpackage #:cl-start
  (:use #:cl #:hunchentoot)
    (:export :main))
```

## Makefile for creating an executable

Create a makefile with following content.

```
all: build
build:
        sbcl --load cl-start.asd \
        --eval '(ql:quickload :cl-start)' \
        --eval "(sb-ext:save-lisp-and-die #p\"cl-start\" :toplevel #'cl-start:main :executable t)"
```

## Compile and Running Server

```
make

sbcl --load cl-start.asd \
        --eval '(ql:quickload :cl-start)' \
        --eval "(sb-ext:save-lisp-and-die #p\"cl-start\" :toplevel #'cl-start:main :executable t)"
This is SBCL 1.5.8, an implementation of ANSI Common Lisp.
More information about SBCL is available at <http://www.sbcl.org/>.

SBCL is free software, provided as is, with absolutely no warranty.
It is mostly in the public domain; some portions are provided under
BSD-style licenses.  See the CREDITS and COPYING files in the
distribution for more information.
To load "cl-start":
  Load 1 ASDF system:
    cl-start
; Loading "cl-start"
.....To load "hunchentoot":
  Load 1 ASDF system:
    hunchentoot
; Loading "hunchentoot"


[undoing binding stack and other enclosing state... done]
[performing final GC... done]
[defragmenting immobile space... (fin,inst,fdefn,code,sym)=1597+1189+21847+21078+25890... done]
[saving current Lisp image into cl-start:
writing 0 bytes from the read-only space at 0x20000000
writing 1264 bytes from the static space at 0x20100000
writing 36798464 bytes from the dynamic space at 0x1000000000
writing 2199552 bytes from the immobile space at 0x20300000
writing 14176256 bytes from the immobile space at 0x21b00000
done]
```

Above `make` command will create a `cl-start` executable that we use to run our HTTP Server

```
./cl-start
```

## client requests

On another window use `curl`  to send http requests to the server.

```
http "http://localhost:8080/hello"
HTTP/1.1 200 OK
Connection: Keep-Alive
Content-Length: 7
Content-Type: text/html; charset=utf-8
Date: Wed, 11 Dec 2019 02:07:41 GMT
Keep-Alive: timeout=20
Server: Hunchentoot 1.2.38

Hello !
```

## Code

Complete source code for this project is available in [github](https://github.com/xydinesh/cl-start).


