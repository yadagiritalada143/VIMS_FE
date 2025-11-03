import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { CreateFoundationalDataComponent } from './create-foundational-data.component';

describe('CreateFoundationalDataComponent', () => {
  let component: CreateFoundationalDataComponent;
  let fixture: ComponentFixture<CreateFoundationalDataComponent>;
  CommonTestingModule.setUpTestBed(CreateFoundationalDataComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateFoundationalDataComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateFoundationalDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
