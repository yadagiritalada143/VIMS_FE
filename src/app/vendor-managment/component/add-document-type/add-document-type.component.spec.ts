import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AddDocumentTypeComponent } from './add-document-type.component';

describe('AddDocumentTypeComponent', () => {
  let component: AddDocumentTypeComponent;
  let fixture: ComponentFixture<AddDocumentTypeComponent>;
  CommonTestingModule.setUpTestBed(AddDocumentTypeComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AddDocumentTypeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddDocumentTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
