import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ListFoundationalDataComponent } from './list-foundational-data.component';

describe('ListFoundationalDataComponent', () => {
  let component: ListFoundationalDataComponent;
  let fixture: ComponentFixture<ListFoundationalDataComponent>;

  CommonTestingModule.setUpTestBed(ListFoundationalDataComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ListFoundationalDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
